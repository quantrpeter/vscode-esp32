# esp32

Using mpremote to play with ESP32

![](https://github.com/quantrpeter/vscode-esp32/blob/master/screencapture/vscode-esp32-introduction.gif?raw=true)

## Supported mpremote Commands

| Example Usage                      | Description                                 |
|------------------------------------|---------------------------------------------|
| mpremote fs mkdir :folder          | Create a folder on ESP32                    |
| mpremote cat :file.py              | Read a file from ESP32                      |
| mpremote ls :/                     | List files on ESP32                         |
| mpremote rm :file.py               | Remove a file from ESP32                    |
| mpremote run file.py               | Run a file on ESP32                         |
| mpremote cp file.py :/             | Copy file from local to ESP32                |
| mpremote cp :src.py :dest.py       | Copy file between ESP32 folders              |
| mpremote reset                     | Reset the ESP32 device                      |

## Commands

### esp32.openFilesPanel
Show a panel listing MicroPython files for ESP32 projects. This helps you browse, open, and manage files directly from the VS Code interface.

# development

use node v24.2.0

## deploy

change version in package.json

vsce package

vsce publish

# developer

Peter <peter@hkprog.org> , Chairman of Hong Kong Programming Society
