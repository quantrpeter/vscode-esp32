import { exec } from 'child_process';

/**
 * Reads a file from ESP32 using mpremote.
 * @param filename The name of the file to read from ESP32.
 * @returns Promise<string> The file contents.
 */
export async function mpremoteCat(filename: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        exec(`mpremote cat :${filename}`, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

/**
 * Lists files on ESP32 using mpremote.
 * @returns Promise<string> The list of files.
 */
export async function mpremoteLs(): Promise<string> {
    return await new Promise((resolve, reject) => {
        exec('mpremote ls :', (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

/**
 * Removes a file from ESP32 using mpremote.
 * @param filename The name of the file to remove from ESP32.
 * @returns Promise<string> The command output.
 */
export async function mpremoteRm(filename: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        exec(`mpremote rm :${filename}`, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

/**
 * Runs a file on ESP32 using mpremote.
 * @param filename The name of the file to run on ESP32.
 * @returns Promise<string> The command output.
 */
export async function mpremoteRun(filename: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        console.log(`mpremote run ${filename}`);
        exec(`mpremote run ${filename}`, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

/**
 * Copies a file from local to ESP32 using mpremote cp.
 * @param localPath The local file path to copy.
 * @returns Promise<string> The command output.
 */
export async function mpremoteCp(localPath: string, filename: string = ""): Promise<string> {
    // const path = require('path');
    // const filename = path.basename(localPath);
    return await new Promise((resolve, reject) => {
        exec(`mpremote cp ${localPath} :`, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

export async function mpremoteCp2(remoteFromPath: string, remoteToPath: string): Promise<string> {
    // const path = require('path');
    // const filename = path.basename(localPath);
    return await new Promise((resolve, reject) => {
        exec(`mpremote cp :${remoteFromPath} :${remoteToPath}`, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

/**
 * Resets the ESP32 using mpremote.
 * @returns Promise<string> The command output.
 */
export async function mpremoteReset(): Promise<string> {
    return await new Promise((resolve, reject) => {
        exec('mpremote reset', (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}
