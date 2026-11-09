#include "json_rpc.h"
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdio.h>

static void skip_ws(const char **p, const char *end) {
    while (*p < end && isspace((unsigned char)**p)) {
        (*p)++;
    }
}

static uqt_json_val_t *parse_val(const char **p, const char *end);

static char *parse_str_raw(const char **p, const char *end) {
    if (*p >= end || **p != '"') return NULL;
    (*p)++; /* skip opening quote */
    size_t cap = 64;
    size_t len = 0;
    char *buf = malloc(cap);
    if (!buf) return NULL;

    while (*p < end && **p != '"') {
        if (**p == '\\') {
            (*p)++;
            if (*p >= end) break;
            char c = **p;
            switch (c) {
                case 'n': c = '\n'; break;
                case 'r': c = '\r'; break;
                case 't': c = '\t'; break;
                case '\\': c = '\\'; break;
                case '"': c = '"'; break;
                case '/': c = '/'; break;
                default: break;
            }
            if (len + 2 >= cap) {
                cap *= 2;
                buf = realloc(buf, cap);
            }
            buf[len++] = c;
        } else {
            if (len + 2 >= cap) {
                cap *= 2;
                buf = realloc(buf, cap);
            }
            buf[len++] = **p;
        }
        (*p)++;
    }
    if (*p < end && **p == '"') (*p)++; /* skip closing quote */
    buf[len] = '\0';
    return buf;
}

static uqt_json_val_t *parse_obj(const char **p, const char *end) {
    (*p)++; /* skip '{' */
    uqt_json_val_t *obj = calloc(1, sizeof(uqt_json_val_t));
    obj->type = UQT_JSON_OBJECT;
    size_t cap = 8;
    obj->u.obj_val.pairs = malloc(cap * sizeof(uqt_json_pair_t));
    obj->u.obj_val.count = 0;

    skip_ws(p, end);
    if (*p < end && **p == '}') {
        (*p)++;
        return obj;
    }

    while (*p < end) {
        skip_ws(p, end);
        if (**p != '"') break;
        char *key = parse_str_raw(p, end);
        if (!key) break;
        skip_ws(p, end);
        if (*p >= end || **p != ':') {
            free(key);
            break;
        }
        (*p)++; /* skip ':' */
        skip_ws(p, end);
        uqt_json_val_t *val = parse_val(p, end);
        if (!val) {
            free(key);
            break;
        }

        if (obj->u.obj_val.count >= cap) {
            cap *= 2;
            obj->u.obj_val.pairs = realloc(obj->u.obj_val.pairs, cap * sizeof(uqt_json_pair_t));
        }
        obj->u.obj_val.pairs[obj->u.obj_val.count].key = key;
        obj->u.obj_val.pairs[obj->u.obj_val.count].val = val;
        obj->u.obj_val.count++;

        skip_ws(p, end);
        if (*p < end && **p == ',') {
            (*p)++;
            continue;
        }
        if (*p < end && **p == '}') {
            (*p)++;
            break;
        }
    }
    return obj;
}

static uqt_json_val_t *parse_arr(const char **p, const char *end) {
    (*p)++; /* skip '[' */
    uqt_json_val_t *arr = calloc(1, sizeof(uqt_json_val_t));
    arr->type = UQT_JSON_ARRAY;
    size_t cap = 8;
    arr->u.arr_val.items = malloc(cap * sizeof(uqt_json_val_t*));
    arr->u.arr_val.count = 0;

    skip_ws(p, end);
    if (*p < end && **p == ']') {
        (*p)++;
        return arr;
    }

    while (*p < end) {
        skip_ws(p, end);
        uqt_json_val_t *item = parse_val(p, end);
        if (!item) break;

        if (arr->u.arr_val.count >= cap) {
            cap *= 2;
            arr->u.arr_val.items = realloc(arr->u.arr_val.items, cap * sizeof(uqt_json_val_t*));
        }
        arr->u.arr_val.items[arr->u.arr_val.count++] = item;

        skip_ws(p, end);
        if (*p < end && **p == ',') {
            (*p)++;
            continue;
        }
        if (*p < end && **p == ']') {
            (*p)++;
            break;
        }
    }
    return arr;
}

static uqt_json_val_t *parse_val(const char **p, const char *end) {
    skip_ws(p, end);
    if (*p >= end) return NULL;

    if (**p == '{') {
        return parse_obj(p, end);
    } else if (**p == '[') {
        return parse_arr(p, end);
    } else if (**p == '"') {
        char *s = parse_str_raw(p, end);
        if (!s) return NULL;
        uqt_json_val_t *val = calloc(1, sizeof(uqt_json_val_t));
        val->type = UQT_JSON_STRING;
        val->u.str_val = s;
        return val;
    } else if (strncmp(*p, "true", 4) == 0) {
        *p += 4;
        uqt_json_val_t *val = calloc(1, sizeof(uqt_json_val_t));
        val->type = UQT_JSON_BOOL;
        val->u.bool_val = true;
        return val;
    } else if (strncmp(*p, "false", 5) == 0) {
        *p += 5;
        uqt_json_val_t *val = calloc(1, sizeof(uqt_json_val_t));
        val->type = UQT_JSON_BOOL;
        val->u.bool_val = false;
        return val;
    } else if (strncmp(*p, "null", 4) == 0) {
        *p += 4;
        uqt_json_val_t *val = calloc(1, sizeof(uqt_json_val_t));
        val->type = UQT_JSON_NULL;
        return val;
    } else if (isdigit((unsigned char)**p) || **p == '-') {
        char *next_ptr = NULL;
        double num = strtod(*p, &next_ptr);
        if (next_ptr > *p) {
            *p = next_ptr;
            uqt_json_val_t *val = calloc(1, sizeof(uqt_json_val_t));
            val->type = UQT_JSON_NUMBER;
            val->u.num_val = num;
            return val;
        }
    }
    return NULL;
}

uqt_json_val_t *uqt_json_parse(const char *json_str, size_t len) {
    if (!json_str || len == 0) return NULL;
    const char *p = json_str;
    const char *end = json_str + len;
    return parse_val(&p, end);
}

void uqt_json_free(uqt_json_val_t *val) {
    if (!val) return;
    if (val->type == UQT_JSON_STRING) {
        free(val->u.str_val);
    } else if (val->type == UQT_JSON_ARRAY) {
        for (size_t i = 0; i < val->u.arr_val.count; i++) {
            uqt_json_free(val->u.arr_val.items[i]);
        }
        free(val->u.arr_val.items);
    } else if (val->type == UQT_JSON_OBJECT) {
        for (size_t i = 0; i < val->u.obj_val.count; i++) {
            free(val->u.obj_val.pairs[i].key);
            uqt_json_free(val->u.obj_val.pairs[i].val);
        }
        free(val->u.obj_val.pairs);
    }
    free(val);
}

uqt_json_val_t *uqt_json_obj_get(const uqt_json_val_t *obj, const char *key) {
    if (!obj || obj->type != UQT_JSON_OBJECT || !key) return NULL;
    for (size_t i = 0; i < obj->u.obj_val.count; i++) {
        if (strcmp(obj->u.obj_val.pairs[i].key, key) == 0) {
            return obj->u.obj_val.pairs[i].val;
        }
    }
    return NULL;
}

const char *uqt_json_obj_get_str(const uqt_json_val_t *obj, const char *key) {
    uqt_json_val_t *v = uqt_json_obj_get(obj, key);
    return (v && v->type == UQT_JSON_STRING) ? v->u.str_val : NULL;
}

double uqt_json_obj_get_num(const uqt_json_val_t *obj, const char *key, double default_val) {
    uqt_json_val_t *v = uqt_json_obj_get(obj, key);
    return (v && v->type == UQT_JSON_NUMBER) ? v->u.num_val : default_val;
}

bool uqt_json_obj_get_bool(const uqt_json_val_t *obj, const char *key, bool default_val) {
    uqt_json_val_t *v = uqt_json_obj_get(obj, key);
    return (v && v->type == UQT_JSON_BOOL) ? v->u.bool_val : default_val;
}

uqt_json_val_t *uqt_json_arr_get(const uqt_json_val_t *arr, size_t idx) {
    if (!arr || arr->type != UQT_JSON_ARRAY || idx >= arr->u.arr_val.count) return NULL;
    return arr->u.arr_val.items[idx];
}

size_t uqt_json_arr_len(const uqt_json_val_t *arr) {
    if (!arr || arr->type != UQT_JSON_ARRAY) return 0;
    return arr->u.arr_val.count;
}
