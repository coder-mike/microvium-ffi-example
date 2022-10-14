cmake_minimum_required(VERSION 3.10)

project(microviumHost VERSION 0.1.0 LANGUAGES C CXX)

add_executable(${PROJECT_NAME}
        ./microvium.c
        ./microvium.h
        ./microvium_port.h
        ./main.cpp
        ./app_ffi.hpp
        ./app_ffi.cpp
        )

target_compile_features(${PROJECT_NAME}
        PRIVATE
        cxx_std_17
        )

target_link_libraries(
        ${PROJECT_NAME}
)