cmake_minimum_required(VERSION 3.10)
project(uqt_miner VERSION 0.1.0 LANGUAGES C)

# Set C11 or C17 standard
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Base compiler flags (Release by default)
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

# Strict warnings
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Wextra -Wpedantic -Wno-unused-parameter -Werror=vla -Werror=implicit-function-declaration")

# Release optimization flags
set(CMAKE_C_FLAGS_RELEASE "-O3 -DNDEBUG -march=native -funroll-loops -fomit-frame-pointer -fno-math-errno")
# Optional LTO
include(CheckIPOSupported)
check_ipo_supported(RESULT ipo_supported)
if(ipo_supported AND CMAKE_BUILD_TYPE STREQUAL "Release")
    set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)
endif()

# Threading support
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)

# Math library (usually needed on Linux)
find_library(MATH_LIBRARY m)

# Directories
include_directories(include)

# Find sources
file(GLOB_RECURSE SRC_FILES 
    "src/*.c"
)
# Exclude SIMD and specific backends from general GLOB to compile them with specific flags
list(FILTER SRC_FILES EXCLUDE REGEX ".*_avx2\\.c$")
list(FILTER SRC_FILES EXCLUDE REGEX ".*_shani\\.c$")
list(FILTER SRC_FILES EXCLUDE REGEX ".*_aesni\\.c$")

add_executable(uqt_miner ${SRC_FILES})

# Add SIMD sources to main executable conditionally based on compiler support, 
# or just add them with proper flags. We will add them with target flags.
set(AVX2_SRC "src/algo/sha256d/sha256d_avx2.c" "src/algo/blake2b/blake2b_avx2.c")
set(SHANI_SRC "src/algo/sha256d/sha256d_shani.c")

if(CMAKE_C_COMPILER_ID MATCHES "GNU|Clang")
    # For now, we assume x86_64 target for AVX2/SHA-NI. 
    # Proper cross-compilation would check CMAKE_SYSTEM_PROCESSOR.
    set_source_files_properties(${AVX2_SRC} PROPERTIES COMPILE_FLAGS "-mavx2")
    set_source_files_properties(${SHANI_SRC} PROPERTIES COMPILE_FLAGS "-msha -msse4.1")
    set_source_files_properties("src/algo/gr/cn/cryptonight.c" PROPERTIES COMPILE_FLAGS "-maes -msse4.1")
elseif(MSVC)
    set_source_files_properties(${AVX2_SRC} PROPERTIES COMPILE_FLAGS "/arch:AVX2")
endif()

target_sources(uqt_miner PRIVATE ${AVX2_SRC} ${SHANI_SRC})

target_link_libraries(uqt_miner Threads::Threads)
if(MATH_LIBRARY)
    target_link_libraries(uqt_miner ${MATH_LIBRARY})
endif()

# Enable Testing
enable_testing()
add_subdirectory(tests)
