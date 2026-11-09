#include "uqt/algo.h"
#include <stdio.h>
#include <string.h>

static void hex_to_bytes(const char *hex, uint8_t *bytes) {
    for (size_t i = 0; i < 64; i++) {
        unsigned int val;
        sscanf(hex + 2 * i, "%02x", &val);
        bytes[i] = (uint8_t)val;
    }
}

static bool test_blake2b_vector(const uqt_algo_backend_t *backend, const char *input_str, size_t count, const char *expected_hex) {
    uint8_t expected[64];
    hex_to_bytes(expected_hex, expected);
    
    uint8_t input[512] = {0};
    size_t str_len = strlen(input_str);
    for (size_t i = 0; i < count; i++) {
        if (str_len == 1 && count > 1) input[i] = input_str[0];
        else if (i < str_len) input[i] = input_str[i];
        else input[i] = 0;
    }
    
    uint8_t output[64] = {0};
    if (backend->hash(NULL, input, count, output) != UQT_SUCCESS) {
        printf("ERROR: Hash call failed for length %zu\n", count);
        return false;
    }
    
    if (memcmp(output, expected, 64) != 0) {
        printf("ERROR: Mismatch for length %zu\n", count);
        printf("Expected: %s\n", expected_hex);
        printf("Got     : ");
        for (int i=0; i<64; i++) printf("%02x", output[i]);
        printf("\n");
        return false;
    }
    return true;
}

int main(void) {
    printf("Starting BLAKE2b test...\n");

    const uqt_algo_t *algo = &uqt_algo_blake2b;
    const uqt_algo_backend_t *backend = algo->backends[0]; /* scalar */

    struct {
        const char *input;
        size_t len;
        const char *expected;
    } vectors[] = {
        {"", 0, "786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce"},
        {"abc", 3, "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"},
        {"a", 55, "376ac9000d4cd4d3fcdbfd857022245bb6a5120ef08e9e741f2666400a426278ebf73f5eb5ed21c0ee50d3f558829805de1ce9a8097b33d2499e5c0fc8f76dfe"},
        {"a", 56, "f9b5059561f8b9e80d479466be753b9395b7860d2f3e99bea262074afd8eed5ceefc67730b4fe6191b0e5475712eaa99922e8f11662cd4bce0792aeddce337fa"},
        {"a", 63, "95b7074f4b31630682bd4d24d20d02627e82fb244bf59720f1c22c754e649262614c06596ef63ec3064100ff33aac540b1093be43e5fd0e0325f8f9ad2315913"},
        {"a", 64, "29119322fbf7552c76c608d4d61bd648175dfc856f714992a950da978d5609bac2ce1dea8e12d06b1dba888c897ba37f905386620e08ec992b2ae7ffb68fd7ea"},
        {"a", 65, "59041e07da048e58d77635e903fee63015e4a6adf25c99a8b6bd12935459f72546b56d0dd4d26a00f863f51d236e545ef34e32791ac51208010b94a8d360a162"},
        {"a", 127, "94596b9d6199c807c40ae1a935f3633ba5a8dd5655f7f1bd44f5285b1ce8dbb0054771eba409539df85a963296d28788807105153c90fa3ec3d761228e90f8b8"},
        {"a", 128, "fc6c71f688f43ea7d60817478808f3cac753e61571865c95adbc2d9122c943a76b92c2cb1047ef3fe7bf6e436ec1d0a99a9e5b216780bf7fed9d7ca91d3a8f3b"},
        {"a", 129, "55e6e0eb418149a8af92fd9ddc99254781b2f522a131b4f4d984404b71a00e1167b8124d5dcddd4c6977b299392335d6edd303da6d344d74bbef2d38101b232b"},
        {"a", 255, "792ea4793169359d36f13f472d4b427b40c663c680f47932a0cf3a110e6d84305f46825da8ada4d83a6247bb09fb3bb1b5781186a81b2aff8c9c39a597e447dd"},
        {"a", 256, "0eee13d0c73a2710c5015a8b4be0a16120bb88f826b662951ffe4b3b81441cfdce1f712c58e237dba72a0dad7f9c86b9745ea0b4b3b850ff3a260fb7df9d3e81"},
        {"a", 257, "0d686cbcff66401ab36b8a8e7fcf4085319eb296eaa55c4470c36bccaff2ecd4b3572c32ed48e8bb97cc5d08302a79b3a26e751feb7f565b19fa0d8f65247dd1"}
    };

    for (size_t i = 0; i < sizeof(vectors) / sizeof(vectors[0]); i++) {
        if (!test_blake2b_vector(backend, vectors[i].input, vectors[i].len, vectors[i].expected)) {
            return 1;
        }
    }

    printf("BLAKE2b tests passed.\n");
    return 0;
}
