cmake_minimum_required(VERSION 3.10)

# All GhostRider hash + CryptoNight source files
set(GR_SOURCES
    ../src/algo/gr/gr_scalar.c
    ../src/algo/gr/hashes/blake512.c
    ../src/algo/gr/hashes/bmw512.c
    ../src/algo/gr/hashes/groestl512.c
    ../src/algo/gr/hashes/jh512.c
    ../src/algo/gr/hashes/keccak512.c
    ../src/algo/gr/hashes/skein512.c
    ../src/algo/gr/hashes/luffa512.c
    ../src/algo/gr/hashes/cubehash512.c
    ../src/algo/gr/hashes/shavite512.c
    ../src/algo/gr/hashes/simd512.c
    ../src/algo/gr/hashes/echo512.c
    ../src/algo/gr/hashes/hamsi512.c
    ../src/algo/gr/hashes/fugue512.c
    ../src/algo/gr/hashes/shabal512.c
    ../src/algo/gr/hashes/whirlpool.c
    ../src/algo/gr/cn/cryptonight.c
)

add_executable(test_utils test_utils.c ../src/utils/logger.c ../src/utils/timer.c)
target_link_libraries(test_utils Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(test_utils ${MATH_LIBRARY})
endif()
target_include_directories(test_utils PRIVATE ../include)

add_executable(test_cpu test_cpu.c ../src/cpu/cpu_detect.c ../src/cpu/topology.c ../src/memory/hugepages.c ../src/memory/numa.c ../src/memory/scratchpad.c ../src/algo/algo_registry.c ../src/algo/sha256d/sha256d_scalar.c ../src/algo/sha256d/sha256d_shani.c ../src/algo/sha256d/sha256d_avx2.c ../src/algo/blake2b/blake2b_scalar.c ../src/algo/blake2b/blake2b_avx2.c ${GR_SOURCES} ../src/utils/timer.c)
target_link_libraries(test_cpu Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(test_cpu ${MATH_LIBRARY})
endif()
target_include_directories(test_cpu PRIVATE ../include)

add_executable(test_memory test_memory.c ../src/memory/hugepages.c ../src/memory/numa.c ../src/memory/scratchpad.c ../src/utils/timer.c)
target_link_libraries(test_memory Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(test_memory ${MATH_LIBRARY})
endif()
target_include_directories(test_memory PRIVATE ../include)

add_executable(test_sha256d test_sha256d.c ../src/algo/sha256d/sha256d_scalar.c ../src/algo/sha256d/sha256d_shani.c ../src/algo/sha256d/sha256d_avx2.c)
target_link_libraries(test_sha256d Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(test_sha256d ${MATH_LIBRARY})
endif()
target_include_directories(test_sha256d PRIVATE ../include)

add_executable(test_blake2b test_blake2b.c ../src/algo/blake2b/blake2b_scalar.c ../src/algo/blake2b/blake2b_avx2.c)
target_link_libraries(test_blake2b Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(test_blake2b ${MATH_LIBRARY})
endif()
target_include_directories(test_blake2b PRIVATE ../include)

add_executable(test_algo_backends test_algo_backends.c
    ../src/algo/algo_registry.c 
    ../src/algo/sha256d/sha256d_scalar.c 
    ../src/algo/sha256d/sha256d_shani.c 
    ../src/algo/sha256d/sha256d_avx2.c
    ../src/algo/blake2b/blake2b_scalar.c
    ../src/algo/blake2b/blake2b_avx2.c
    ${GR_SOURCES}
    ../src/cpu/cpu_detect.c
    ../src/cpu/topology.c
    ../src/memory/hugepages.c
    ../src/memory/numa.c
    ../src/memory/scratchpad.c
    ../src/utils/timer.c
)
target_link_libraries(test_algo_backends Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(test_algo_backends ${MATH_LIBRARY})
endif()
target_include_directories(test_algo_backends PRIVATE ../include)

# Worker Engine Test
add_executable(test_worker test_worker.c
    ../src/worker/worker_pool.c
    ../src/worker/job.c
    ../src/algo/algo_registry.c
    ../src/algo/sha256d/sha256d_scalar.c
    ../src/algo/sha256d/sha256d_shani.c
    ../src/algo/sha256d/sha256d_avx2.c
    ../src/algo/blake2b/blake2b_scalar.c
    ../src/algo/blake2b/blake2b_avx2.c
    ${GR_SOURCES}
    ../src/cpu/cpu_detect.c
    ../src/cpu/topology.c
    ../src/memory/hugepages.c
    ../src/memory/numa.c
    ../src/memory/scratchpad.c
    ../src/utils/timer.c
)
target_link_libraries(test_worker Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(test_worker ${MATH_LIBRARY})
endif()
target_include_directories(test_worker PRIVATE ../include)

# Autotune Test
add_executable(test_autotune test_autotune.c
    ../src/worker/autotune.c
    ../src/worker/worker_pool.c
    ../src/worker/job.c
    ../src/algo/algo_registry.c
    ../src/algo/sha256d/sha256d_scalar.c
    ../src/algo/sha256d/sha256d_shani.c
    ../src/algo/sha256d/sha256d_avx2.c
    ../src/algo/blake2b/blake2b_scalar.c
    ../src/algo/blake2b/blake2b_avx2.c
    ${GR_SOURCES}
    ../src/cpu/cpu_detect.c
    ../src/cpu/topology.c
    ../src/memory/hugepages.c
    ../src/memory/numa.c
    ../src/memory/scratchpad.c
    ../src/utils/timer.c
)
target_link_libraries(test_autotune Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(test_autotune ${MATH_LIBRARY})
endif()
target_include_directories(test_autotune PRIVATE ../include)

if(CMAKE_C_COMPILER_ID MATCHES "GNU|Clang")
    set_source_files_properties(../src/algo/sha256d/sha256d_avx2.c PROPERTIES COMPILE_FLAGS "-mavx2")
    set_source_files_properties(../src/algo/blake2b/blake2b_avx2.c PROPERTIES COMPILE_FLAGS "-mavx2")
    set_source_files_properties(../src/algo/sha256d/sha256d_shani.c PROPERTIES COMPILE_FLAGS "-msha -msse4.1")
    set_source_files_properties(../src/algo/gr/cn/cryptonight.c PROPERTIES COMPILE_FLAGS "-maes -msse4.1")
elseif(MSVC)
    set_source_files_properties(../src/algo/sha256d/sha256d_avx2.c PROPERTIES COMPILE_FLAGS "/arch:AVX2")
    set_source_files_properties(../src/algo/blake2b/blake2b_avx2.c PROPERTIES COMPILE_FLAGS "/arch:AVX2")
endif()

add_executable(test_net test_net.c
    ../src/net/json_rpc.c
    ../src/net/stratum.c
    ../src/algo/algo_registry.c
    ../src/algo/sha256d/sha256d_scalar.c
    ../src/algo/sha256d/sha256d_shani.c
    ../src/algo/sha256d/sha256d_avx2.c
    ../src/algo/blake2b/blake2b_scalar.c
    ../src/algo/blake2b/blake2b_avx2.c
    ${GR_SOURCES}
    ../src/cpu/cpu_detect.c
    ../src/cpu/topology.c
    ../src/memory/hugepages.c
    ../src/memory/numa.c
    ../src/memory/scratchpad.c
    ../src/worker/job.c
    ../src/utils/logger.c
    ../src/utils/timer.c
)
target_link_libraries(test_net Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(test_net ${MATH_LIBRARY})
endif()
target_include_directories(test_net PRIVATE ../include)

add_test(NAME UtilsTest COMMAND test_utils)
add_test(NAME CpuTest COMMAND test_cpu)
add_test(NAME MemoryTest COMMAND test_memory)
add_test(NAME Sha256dTest COMMAND test_sha256d)
add_test(NAME Blake2bTest COMMAND test_blake2b)
add_test(NAME AlgoBackendsTest COMMAND test_algo_backends)
add_test(NAME WorkerTest COMMAND test_worker)
add_test(NAME AutotuneTest COMMAND test_autotune)
add_test(NAME NetTest COMMAND test_net)

