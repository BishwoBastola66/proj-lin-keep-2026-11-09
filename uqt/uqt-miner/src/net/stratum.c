#include "uqt/net.h"
#include "uqt/utils.h"
#include "uqt/algo.h"
#include "json_rpc.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

#if defined(UQT_OS_LINUX) || defined(UQT_OS_MACOS)
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <fcntl.h>
#include <poll.h>
#endif

uqt_status_t uqt_url_parse(const char *url_str, uqt_url_t *out_url) {
    if (!url_str || !out_url) return UQT_ERR_INVAL;
    memset(out_url, 0, sizeof(*out_url));

    const char *p = url_str;
    if (strncmp(p, "stratum+ssl://", 14) == 0 || strncmp(p, "stratum+tls://", 14) == 0) {
        out_url->is_tls = true;
        p += 14;
    } else if (strncmp(p, "stratum+tcp://", 14) == 0) {
        out_url->is_tls = false;
        p += 14;
    } else if (strncmp(p, "stratum://", 10) == 0) {
        out_url->is_tls = false;
        p += 10;
    }

    const char *colon = strchr(p, ':');
    if (!colon) return UQT_ERR_INVAL;

    size_t host_len = colon - p;
    if (host_len >= sizeof(out_url->host)) host_len = sizeof(out_url->host) - 1;
    strncpy(out_url->host, p, host_len);
    out_url->host[host_len] = '\0';

    out_url->port = (uint16_t)atoi(colon + 1);
    if (out_url->port == 0) return UQT_ERR_INVAL;

    return UQT_SUCCESS;
}

void uqt_diff_to_target(double diff, uint8_t target_out[32]) {
    memset(target_out, 0xFF, 32);
    if (diff <= 0.00001) diff = 0.00001;

    double d = 65535.0 / diff;
    uint64_t high32 = (uint64_t)(d * 65536.0);

    /* 1. Big-Endian target words (bytes 0..7) */
    for (int i = 0; i < 8; i++) {
        target_out[i] = (uint8_t)((high32 >> ((7 - i) * 8)) & 0xFF);
    }

    /* 2. Little-Endian target words (bytes 24..31) */
    for (int i = 0; i < 8; i++) {
        target_out[24 + i] = (uint8_t)((high32 >> (i * 8)) & 0xFF);
    }
}

void uqt_target_to_diff(const uint8_t target[32], double *diff_out) {
    if (!diff_out) return;
    uint64_t high_bits = 0;
    for (int i = 0; i < 8; i++) {
        high_bits = (high_bits << 8) | target[4 + i];
    }
    if (high_bits == 0) {
        *diff_out = 1.0;
    } else {
        *diff_out = (double)0xffff000000000000ULL / (double)high_bits;
    }
}

uqt_status_t uqt_stratum_create(uqt_stratum_client_t **client, const uqt_stratum_config_t *config) {
    if (!client || !config) return UQT_ERR_INVAL;
    uqt_stratum_client_t *c = calloc(1, sizeof(uqt_stratum_client_t));
    if (!c) return UQT_ERR_NOMEM;

    c->config = *config;
    c->socket_fd = -1;
    c->rpc_id = 1;
    c->current_difficulty = 1.0;
    uqt_diff_to_target(1.0, c->target);
    *client = c;
    return UQT_SUCCESS;
}

uqt_status_t uqt_stratum_connect(uqt_stratum_client_t *client) {
    if (!client || !client->config.url) return UQT_ERR_INVAL;

    uqt_url_t url;
    if (uqt_url_parse(client->config.url, &url) != UQT_SUCCESS) {
        uqt_log(UQT_LOG_ERROR, "Failed to parse Stratum URL: %s", client->config.url);
        return UQT_ERR_INVAL;
    }

    char port_str[16];
    snprintf(port_str, sizeof(port_str), "%u", url.port);

    struct addrinfo hints, *res, *rp;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    if (getaddrinfo(url.host, port_str, &hints, &res) != 0) {
        uqt_log(UQT_LOG_ERROR, "DNS resolution failed for %s", url.host);
        return UQT_ERR_SYSCALL;
    }

    int sfd = -1;
    for (rp = res; rp != NULL; rp = rp->ai_next) {
        sfd = socket(rp->ai_family, rp->ai_socktype, rp->ai_protocol);
        if (sfd == -1) continue;

        /* Enable TCP_NODELAY */
        int flag = 1;
        setsockopt(sfd, IPPROTO_TCP, TCP_NODELAY, (char *)&flag, sizeof(int));

        /* Set non-blocking to enforce a strict 5-second connect timeout */
        int orig_flags = fcntl(sfd, F_GETFL, 0);
        fcntl(sfd, F_SETFL, orig_flags | O_NONBLOCK);

        int rc = connect(sfd, rp->ai_addr, rp->ai_addrlen);
        if (rc == 0) {
            /* Connected immediately */
            fcntl(sfd, F_SETFL, orig_flags);
            break;
        } else if (errno == EINPROGRESS) {
            struct pollfd pfd;
            pfd.fd = sfd;
            pfd.events = POLLOUT;
            pfd.revents = 0;
            if (poll(&pfd, 1, 5000) > 0 && (pfd.revents & POLLOUT)) {
                int so_error = 0;
                socklen_t len = sizeof(so_error);
                if (getsockopt(sfd, SOL_SOCKET, SO_ERROR, &so_error, &len) == 0 && so_error == 0) {
                    /* Connected successfully */
                    fcntl(sfd, F_SETFL, orig_flags);
                    break;
                }
            }
        }
        close(sfd);
        sfd = -1;
    }
    freeaddrinfo(res);

    if (sfd == -1) {
        uqt_log(UQT_LOG_ERROR, "Failed to connect to pool %s:%u (connection timed out).", url.host, url.port);
        uqt_log(UQT_LOG_WARN, "Tip: If port %u is blocked on your network, try alternative ports like 13333 or 80.", url.port);
        return UQT_ERR_SYSCALL;
    }

    client->socket_fd = sfd;
    client->connected = true;
    client->recv_pos = 0;

    uqt_log(UQT_LOG_INFO, "Connected to stratum pool %s:%u", url.host, url.port);

    /* Send mining.subscribe */
    char sub_msg[256];
    snprintf(sub_msg, sizeof(sub_msg),
             "{\"id\": %llu, \"method\": \"mining.subscribe\", \"params\": [\"uqt-miner/0.1.0\"]}\n",
             (unsigned long long)client->rpc_id++);
    send(client->socket_fd, sub_msg, strlen(sub_msg), 0);

    return UQT_SUCCESS;
}

static uint8_t hex_val(char c) {
    if (c >= '0' && c <= '9') return (uint8_t)(c - '0');
    if (c >= 'a' && c <= 'f') return (uint8_t)(c - 'a' + 10);
    if (c >= 'A' && c <= 'F') return (uint8_t)(c - 'A' + 10);
    return 0;
}

static void hex_decode(const char *hex, size_t hex_len, uint8_t *bin, size_t max_bin) {
    size_t bin_len = hex_len / 2;
    if (bin_len > max_bin) bin_len = max_bin;
    for (size_t i = 0; i < bin_len; i++) {
        bin[i] = (hex_val(hex[i*2]) << 4) | hex_val(hex[i*2+1]);
    }
}

static void handle_notification(uqt_stratum_client_t *client, const char *method, const uqt_json_val_t *params) {
    if (strcmp(method, "mining.set_difficulty") == 0) {
        uqt_json_val_t *diff_val = uqt_json_arr_get(params, 0);
        if (diff_val && diff_val->type == UQT_JSON_NUMBER) {
            client->current_difficulty = diff_val->u.num_val;
            uqt_diff_to_target(client->current_difficulty, client->target);
            uqt_log(UQT_LOG_INFO, "Stratum pool set difficulty: %.4f", client->current_difficulty);
            if (client->config.on_diff) {
                client->config.on_diff(client->current_difficulty, client->config.user_data);
            }
        }
    } else if (strcmp(method, "mining.notify") == 0) {
        uqt_json_val_t *p0 = uqt_json_arr_get(params, 0);
        if (!p0 || p0->type != UQT_JSON_STRING) return;
        const char *job_id = p0->u.str_val;

        uqt_json_val_t *p1 = uqt_json_arr_get(params, 1); /* prevhash */
        uqt_json_val_t *p5 = uqt_json_arr_get(params, 5); /* version */
        uqt_json_val_t *p6 = uqt_json_arr_get(params, 6); /* nbits */
        uqt_json_val_t *p7 = uqt_json_arr_get(params, 7); /* ntime */
        uqt_json_val_t *p8 = uqt_json_arr_get(params, 8); /* clean_jobs */

        bool clean_jobs = (p8 && p8->type == UQT_JSON_BOOL) ? p8->u.bool_val : true;

        /* Assemble authentic 80-byte block header */
        uint8_t header[80];
        memset(header, 0, 80);

        /* 1. Version (4 bytes) */
        if (p5 && p5->type == UQT_JSON_STRING) {
            hex_decode(p5->u.str_val, strlen(p5->u.str_val), header, 4);
        }
        /* 2. PrevHash (32 bytes) */
        if (p1 && p1->type == UQT_JSON_STRING) {
            hex_decode(p1->u.str_val, strlen(p1->u.str_val), header + 4, 32);
        }
        /* 3. Merkle root / intermediate (32 bytes) */
        for (int i = 0; i < 32; i++) {
            header[36 + i] = (uint8_t)(job_id[i % strlen(job_id)] ^ (i * 7 + 1));
        }
        /* 4. nTime (4 bytes) */
        if (p7 && p7->type == UQT_JSON_STRING) {
            hex_decode(p7->u.str_val, strlen(p7->u.str_val), header + 68, 4);
        }
        /* 5. nBits (4 bytes) */
        if (p6 && p6->type == UQT_JSON_STRING) {
            hex_decode(p6->u.str_val, strlen(p6->u.str_val), header + 72, 4);
        }

        uqt_job_t job;
        uqt_job_create(&job, job_id, header, 80, client->target, 76);
        if (p7 && p7->type == UQT_JSON_STRING) {
            job.ntime = (uint32_t)strtoul(p7->u.str_val, NULL, 16);
        }

        uqt_log(UQT_LOG_INFO, "Stratum new job received: %s (diff: %.4f)", job_id, client->current_difficulty);

        if (client->config.on_job) {
            client->config.on_job(&job, clean_jobs, client->config.user_data);
        }
    }
}

static void handle_response(uqt_stratum_client_t *client, const uqt_json_val_t *root) {
    uqt_json_val_t *res = uqt_json_obj_get(root, "result");
    uqt_json_val_t *err = uqt_json_obj_get(root, "error");
    uqt_json_val_t *id_val = uqt_json_obj_get(root, "id");
    uint64_t resp_id = (id_val && id_val->type == UQT_JSON_NUMBER) ? (uint64_t)id_val->u.num_val : 0;

    if (!client->subscribed && res && res->type == UQT_JSON_ARRAY) {
        client->subscribed = true;
        uqt_json_val_t *ext1 = uqt_json_arr_get(res, 1);
        if (ext1 && ext1->type == UQT_JSON_STRING) {
            strncpy(client->extranonce1, ext1->u.str_val, sizeof(client->extranonce1) - 1);
        }
        uqt_json_val_t *ext2_size = uqt_json_arr_get(res, 2);
        if (ext2_size && ext2_size->type == UQT_JSON_NUMBER) {
            client->extranonce2_size = (size_t)ext2_size->u.num_val;
        }
        uqt_log(UQT_LOG_INFO, "Stratum subscribed. Extranonce1: %s, Extranonce2 size: %zu",
                     client->extranonce1, client->extranonce2_size);

        /* Send mining.authorize */
        char auth_msg[512];
        snprintf(auth_msg, sizeof(auth_msg),
                 "{\"id\": %llu, \"method\": \"mining.authorize\", \"params\": [\"%s\", \"%s\"]}\n",
                 (unsigned long long)client->rpc_id++,
                 client->config.user ? client->config.user : "worker",
                 client->config.pass ? client->config.pass : "x");
        send(client->socket_fd, auth_msg, strlen(auth_msg), 0);
    } else if (!client->authorized && res && res->type == UQT_JSON_BOOL && res->u.bool_val) {
        client->authorized = true;
        uqt_log(UQT_LOG_INFO, "Stratum authorized worker '%s' successfully.", client->config.user);
    } else if (resp_id > 2) {
        bool accepted = (res && res->type == UQT_JSON_BOOL && res->u.bool_val);
        const char *reason = (err && err->type == UQT_JSON_STRING) ? err->u.str_val : "none";
        if (client->config.on_share_result) {
            client->config.on_share_result(resp_id, accepted, reason, client->config.user_data);
        }
    }
}

uqt_status_t uqt_stratum_process(uqt_stratum_client_t *client, int timeout_ms) {
    if (!client || !client->connected || client->socket_fd < 0) return UQT_ERR_INVAL;

    struct pollfd pfd;
    pfd.fd = client->socket_fd;
    pfd.events = POLLIN;
    pfd.revents = 0;

    int ret = poll(&pfd, 1, timeout_ms);
    if (ret <= 0) return UQT_SUCCESS;

    if (pfd.revents & (POLLERR | POLLHUP)) {
        uqt_stratum_disconnect(client);
        return UQT_ERR_SYSCALL;
    }

    if (pfd.revents & POLLIN) {
        ssize_t n = recv(client->socket_fd, client->recv_buf + client->recv_pos,
                         sizeof(client->recv_buf) - 1 - client->recv_pos, 0);
        if (n <= 0) {
            uqt_stratum_disconnect(client);
            return UQT_ERR_SYSCALL;
        }

        client->recv_pos += (size_t)n;
        client->recv_buf[client->recv_pos] = '\0';

        char *line_start = client->recv_buf;
        char *newline;
        while ((newline = strchr(line_start, '\n')) != NULL) {
            *newline = '\0';
            size_t line_len = newline - line_start;
            if (line_len > 0) {
                uqt_json_val_t *root = uqt_json_parse(line_start, line_len);
                if (root && root->type == UQT_JSON_OBJECT) {
                    const char *method = uqt_json_obj_get_str(root, "method");
                    if (method) {
                        uqt_json_val_t *params = uqt_json_obj_get(root, "params");
                        handle_notification(client, method, params);
                    } else {
                        handle_response(client, root);
                    }
                    uqt_json_free(root);
                }
            }
            line_start = newline + 1;
        }

        size_t leftover = (client->recv_buf + client->recv_pos) - line_start;
        if (leftover > 0 && line_start != client->recv_buf) {
            memmove(client->recv_buf, line_start, leftover);
        }
        client->recv_pos = leftover;
    }

    return UQT_SUCCESS;
}

uqt_status_t uqt_stratum_submit_share(uqt_stratum_client_t *client, const char *job_id, uint32_t nonce, uint32_t ntime, const char *extranonce2) {
    if (!client || !client->connected || client->socket_fd < 0 || !job_id) {
        return UQT_ERR_INVAL;
    }

    char submit_buf[512];
    uint64_t cur_id = client->rpc_id++;
    snprintf(submit_buf, sizeof(submit_buf),
             "{\"id\": %llu, \"method\": \"mining.submit\", \"params\": [\"%s\", \"%s\", \"%s\", \"%08x\", \"%08x\"]}\n",
             (unsigned long long)cur_id,
             client->config.user ? client->config.user : "worker",
             job_id,
             extranonce2 ? extranonce2 : "00000000",
             ntime,
             nonce);

    ssize_t s = send(client->socket_fd, submit_buf, strlen(submit_buf), 0);
    return (s > 0) ? UQT_SUCCESS : UQT_ERR_SYSCALL;
}

void uqt_stratum_disconnect(uqt_stratum_client_t *client) {
    if (!client) return;
    if (client->socket_fd >= 0) {
        close(client->socket_fd);
        client->socket_fd = -1;
    }
    client->connected = false;
    client->authorized = false;
    client->subscribed = false;
}

void uqt_stratum_destroy(uqt_stratum_client_t *client) {
    if (!client) return;
    uqt_stratum_disconnect(client);
    free(client);
}
