#include "uqt/algo.h"
#include <stdio.h>
#include <string.h>

static void hex_to_bytes(const char *hex, uint8_t *bytes) {
    for (size_t i = 0; i < 32; i++) {
        unsigned int val;
        sscanf(hex + 2 * i, "%02x", &val);
        bytes[i] = (uint8_t)val;
    }
}

static bool test_sha256d_vector(const uqt_algo_backend_t *backend, const char *input_str, size_t count, const char *expected_hex) {
    uint8_t expected[32];
    hex_to_bytes(expected_hex, expected);
    
    uint8_t input[512] = {0};
    size_t str_len = strlen(input_str);
    for (size_t i = 0; i < count; i++) {
        if (str_len == 1 && count > 1) input[i] = input_str[0];
        else if (i < str_len) input[i] = input_str[i];
        else input[i] = 0;
    }
    
    uint8_t output[32] = {0};
    if (backend->hash(NULL, input, count, output) != UQT_SUCCESS) {
        printf("ERROR: Hash call failed for length %zu\n", count);
        return false;
    }
    
    if (memcmp(output, expected, 32) != 0) {
        printf("ERROR: Mismatch for length %zu\n", count);
        printf("Expected: %s\n", expected_hex);
        printf("Got     : ");
        for (int i=0; i<32; i++) printf("%02x", output[i]);
        printf("\n");
        return false;
    }
    return true;
}

int main(void) {
    printf("Starting SHA256d test...\n");

    const uqt_algo_t *algo = &uqt_algo_sha256d;
    const uqt_algo_backend_t *backend = algo->backends[0]; /* scalar */

    struct {
        const char *input;
        size_t len;
        const char *expected;
    } vectors[] = {
        {"", 0, "5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456"},
        {"abc", 3, "4f8b42c22dd3729b519ba6f68d2da7cc5b2d606d05daed5ad5128cc03e6c6358"},
        {"a", 55, "566dbb7f0f129482d449b7a4b971b1302f13a1a5e1faee904a0a270b2b6f5a7d"},
        {"a", 56, "122cf0fa8f81dae14842491eedeab26374370514f6c4413bcc32352ae586b39e"},
        {"a", 63, "54f57e8b7d0ed00e442facf36dfa95ce6eb5df391bb7b198a4a3c728b8ba6e76"},
        {"a", 64, "64d28424725a6f219efb17d6f8e4036719bf9e1a8ec2388c22cfb5fc412d46bc"},
        {"a", 65, "fb183eb69ec26b94dbc6ae9ee468e26237cf006ab23823e9d58b818397ec7193"},
        {"a", 127, "3db9cf19720a37d4ebb3eed7b3945dcd65bf9ae63c93bf16791603ffa625aee7"},
        {"a", 128, "0fb4ba94ecf6f40f31757fab9f796e26595d45f0e143b7e97e376763031da930"},
        {"a", 129, "1c2d6ed5d4d9e4411795befe8547cdf34d3ee8c8ef2778b754ac424b5cbb2163"},
        {"a", 255, "558c3093fb6267eaad9cca76f0acde22bc9d41a05b120098fedbbdef40082220"},
        {"a", 256, "f972dddee74ea5067a8a35e495ab1e6435145d2feebbcb8e87cd0332c86e8c3c"},
        {"a", 257, "d138b798b874a913270357df3592eab7915aae189d9cad402651ee11f81aba68"}
    };

    for (size_t i = 0; i < sizeof(vectors) / sizeof(vectors[0]); i++) {
        if (!test_sha256d_vector(backend, vectors[i].input, vectors[i].len, vectors[i].expected)) {
            return 1;
        }
    }

    printf("SHA256d tests passed.\n");
    return 0;
}
