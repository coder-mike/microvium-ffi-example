#include <iostream>
#include "app_ffi.hpp"

using namespace std;
using namespace mvm;

const uint8_t snapshot[] = { 0x06,0x1c,0x06,0x00,0xd6,0x01,0x86,0x58,0x03,0x00,0x00,0x00,0x1c,0x00,0x20,0x00,0x30,0x00,0x30,0x00,0x36,0x00,0x48,0x00,0xa6,0x01,0xb6,0x01,0xff,0xff,0xfe,0xff,0xff,0xff,0xf1,0x00,0xfe,0xff,0x25,0x01,0xfd,0xff,0x2d,0x01,0xfc,0xff,0x39,0x01,0xb5,0x01,0xb1,0x01,0x01,0x00,0xd5,0x00,0xa9,0x00,0x91,0x00,0x5d,0x00,0x85,0x00,0xb1,0x00,0x55,0x00,0xcd,0x00,0x4d,0x00,0x00,0x00,0x05,0x40,0x70,0x75,0x73,0x68,0x00,0x00,0x04,0x40,0x6c,0x6f,0x67,0x00,0x00,0x00,0x26,0x40,0x4e,0x6f,0x74,0x20,0x61,0x76,0x61,0x69,0x6c,0x61,0x62,0x6c,0x65,0x20,0x6f,0x6e,0x20,0x74,0x68,0x69,0x73,0x20,0x68,0x6f,0x73,0x74,0x20,0x28,0x64,0x65,0x74,0x61,0x63,0x68,0x65,0x64,0x29,0x00,0x0a,0x40,0x53,0x74,0x61,0x72,0x74,0x69,0x6e,0x67,0x21,0x00,0x14,0x40,0x47,0x65,0x74,0x74,0x69,0x6e,0x67,0x20,0x72,0x65,0x73,0x6f,0x75,0x72,0x63,0x65,0x2e,0x2e,0x2e,0x00,0x00,0x00,0x06,0x40,0x40,0x72,0x6f,0x6f,0x74,0x00,0x19,0x40,0x54,0x68,0x65,0x20,0x72,0x65,0x73,0x6f,0x75,0x72,0x63,0x65,0x27,0x73,0x20,0x6e,0x61,0x6d,0x65,0x20,0x69,0x73,0x20,0x22,0x00,0x00,0x05,0x40,0x6e,0x61,0x6d,0x65,0x00,0x00,0x02,0x40,0x22,0x00,0x02,0x60,0x00,0x00,0x02,0x60,0x01,0x00,0x0d,0x50,0x04,0x31,0x30,0x30,0x88,0x1d,0x00,0x6b,0x12,0x6f,0x67,0x01,0x60,0x00,0x2f,0x50,0x05,0x88,0x19,0x00,0x89,0x01,0x00,0x88,0x1d,0x00,0x6b,0xa0,0x88,0x19,0x00,0x06,0xa0,0x10,0x12,0xe0,0x70,0x04,0x67,0x67,0x01,0x60,0x89,0x01,0x00,0x10,0x12,0x6b,0x11,0x78,0x01,0xa0,0x67,0x10,0x10,0x07,0x6c,0x10,0xa2,0x67,0x67,0x76,0xe2,0x00,0x00,0x00,0x03,0x50,0x01,0x69,0x60,0x00,0x00,0x00,0x09,0x50,0x04,0x33,0x31,0x32,0x12,0x6f,0x67,0x01,0x60,0x00,0x05,0x50,0x02,0x31,0x32,0x6b,0x60,0x00,0x0d,0x50,0x04,0x89,0x02,0x00,0x89,0x00,0x00,0x88,0x55,0x00,0x12,0x6f,0x60,0x00,0x4b,0x50,0x07,0x88,0x19,0x00,0x89,0x00,0x00,0x10,0x88,0x55,0x00,0x6b,0x11,0x88,0x85,0x00,0x78,0x02,0xa0,0x67,0x89,0x00,0x00,0x10,0x88,0x55,0x00,0x6b,0x11,0x88,0x91,0x00,0x78,0x02,0xa0,0x67,0x89,0x03,0x00,0x01,0x88,0xa9,0x00,0x78,0x02,0xa0,0x89,0x00,0x00,0x10,0x88,0x55,0x00,0x6b,0x11,0x88,0xb1,0x00,0x14,0x88,0xcd,0x00,0x6b,0x6c,0x88,0xd5,0x00,0x6c,0x78,0x02,0xa0,0x67,0x67,0x01,0x60,0x00,0x00,0x00,0x05,0x50,0x00,0x88,0x5d,0x00,0x61,0x00,0x0c,0x00,0x16,0x00,0xd9,0x00,0xdd,0x00,0x19,0x00,0x02,0x00,0x19,0x00,0x01,0x00,0x08,0xc0,0x05,0x00,0x05,0x00,0x4d,0x00,0xe1,0x00,0x08,0xc0,0x05,0x00,0x05,0x00,0x55,0x00,0xa1,0x01,0x04,0xd0,0x1c,0x00,0x0b,0x00,0x04,0xe0,0x41,0x01,0x51,0x01 };

int main(int argc, char** argv) {
    App app(snapshot, sizeof snapshot);
    return 0;
}

Any getResource(App& app, string name) {
    auto resource = app.newObject();
    app.setProp(resource, "name", app.newString("Toby"));
    return resource;
}

void print(App& app, string msg) { std::cout << msg << std::endl; }

