cmake_minimum_required(VERSION 3.22.1)
project("leonidas_native")

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(leonidas_native SHARED
    native_bridge.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../src/disc/iso_image.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../third_party/PS2Recomp/ps2xRuntime/src/lib/ps2_android_runtime.cpp
)

target_include_directories(leonidas_native PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../src
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../third_party/PS2Recomp/ps2xRuntime/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../third_party/PS2Recomp/ps2xCommon/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../third_party/sse2neon
)

find_library(log-lib log)
find_library(android-lib android)

target_link_libraries(leonidas_native PRIVATE
    ${log-lib}
    ${android-lib}
)
