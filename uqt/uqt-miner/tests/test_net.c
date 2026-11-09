#include "uqt/net.h"
#include "../src/net/json_rpc.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

static void test_json_parser_basic(void) {
    const char *json_str = "{\"id\": 1, \"method\": \"mining.set_difficulty\", \"params\": [4.5], \"enabled\": true}";
    uqt_json_val_t *val = uqt_json_parse(json_str, strlen(json_str));
    assert(val != NULL);
    assert(val->type == UQT_JSON_OBJECT);

    const char *method = uqt_json_obj_get_str(val, "method");
    assert(method != NULL && strcmp(method, "mining.set_difficulty") == 0);
    (void)method;

    double id_num = uqt_json_obj_get_num(val, "id", 0);
    assert((int)id_num == 1);
    (void)id_num;

    bool enabled = uqt_json_obj_get_bool(val, "enabled", false);
    assert(enabled == true);
    (void)enabled;

    uqt_json_val_t *params = uqt_json_obj_get(val, "params");
    assert(params != NULL && params->type == UQT_JSON_ARRAY);
    assert(uqt_json_arr_len(params) == 1);

    uqt_json_val_t *p0 = uqt_json_arr_get(params, 0);
    assert(p0 != NULL && p0->type == UQT_JSON_NUMBER && p0->u.num_val == 4.5);
    (void)p0;

    uqt_json_free(val);
    printf("test_json_parser_basic: PASSED\n");
}

static void test_url_parser(void) {
    uqt_url_t url;
    assert(uqt_url_parse("stratum+tcp://ghostrider.unmineable.com:3333", &url) == UQT_SUCCESS);
    assert(strcmp(url.host, "ghostrider.unmineable.com") == 0);
    assert(url.port == 3333);
    assert(!url.is_tls);

    assert(uqt_url_parse("stratum+ssl://pool.example.org:443", &url) == UQT_SUCCESS);
    assert(strcmp(url.host, "pool.example.org") == 0);
    assert(url.port == 443);
    assert(url.is_tls);
    (void)url;

    printf("test_url_parser: PASSED\n");
}

static void test_diff_target_calc(void) {
    uint8_t target[32];
    uqt_diff_to_target(1.0, target);
    
    double diff = 0.0;
    uqt_target_to_diff(target, &diff);
    assert(diff >= 0.99 && diff <= 1.01);

    uqt_diff_to_target(4.0, target);
    uqt_target_to_diff(target, &diff);
    assert(diff >= 3.9 && diff <= 4.1);

    printf("test_diff_target_calc: PASSED\n");
}

int main(void) {
    printf("Running Network & JSON-RPC Unit Tests...\n");
    test_json_parser_basic();
    test_url_parser();
    test_diff_target_calc();
    printf("All Network tests passed successfully!\n");
    return 0;
}
