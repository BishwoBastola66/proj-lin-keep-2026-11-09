#ifndef UQT_JSON_RPC_H
#define UQT_JSON_RPC_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    UQT_JSON_NULL,
    UQT_JSON_BOOL,
    UQT_JSON_NUMBER,
    UQT_JSON_STRING,
    UQT_JSON_ARRAY,
    UQT_JSON_OBJECT
} uqt_json_type_t;

typedef struct uqt_json_val uqt_json_val_t;

typedef struct {
    char *key;
    uqt_json_val_t *val;
} uqt_json_pair_t;

struct uqt_json_val {
    uqt_json_type_t type;
    union {
        bool bool_val;
        double num_val;
        char *str_val;
        struct {
            uqt_json_val_t **items;
            size_t count;
        } arr_val;
        struct {
            uqt_json_pair_t *pairs;
            size_t count;
        } obj_val;
    } u;
};

/* JSON parser */
uqt_json_val_t *uqt_json_parse(const char *json_str, size_t len);
void uqt_json_free(uqt_json_val_t *val);

/* JSON object helper */
uqt_json_val_t *uqt_json_obj_get(const uqt_json_val_t *obj, const char *key);
const char *uqt_json_obj_get_str(const uqt_json_val_t *obj, const char *key);
double uqt_json_obj_get_num(const uqt_json_val_t *obj, const char *key, double default_val);
bool uqt_json_obj_get_bool(const uqt_json_val_t *obj, const char *key, bool default_val);

/* Array helper */
uqt_json_val_t *uqt_json_arr_get(const uqt_json_val_t *arr, size_t idx);
size_t uqt_json_arr_len(const uqt_json_val_t *arr);

#ifdef __cplusplus
}
#endif

#endif /* UQT_JSON_RPC_H */
