/**
 * Creates a folder on ESP32 using mpremote.
 * @param folderName The name of the folder to create on ESP32.
 * @returns Promise<string> The command output.
 */
export async function mpremoteMkdir(currentFolder: string, folderName: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        const path = currentFolder ? `${currentFolder.replace(/\/$/, '')}/${folderName}` : folderName;
        exec(`mpremote fs mkdir :${path}`, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}
import { exec } from 'child_process';

/**
 * Reads a file from ESP32 using mpremote.
 * @param filename The name of the file to read from ESP32.
 * @returns Promise<string> The file contents.
 */
export async function mpremoteCat(currentFolder: string, filename: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        const path = currentFolder ? `${currentFolder.replace(/\/$/, '')}/${filename}` : filename;
        exec(`mpremote cat :${path}`, (error, stdout, stderr) => {
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
export async function mpremoteLs(currentFolder: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        const path = currentFolder ? `:${currentFolder.replace(/\/$/, '')}` : ':';
        exec(`mpremote ls ${path}`, (error, stdout, stderr) => {
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
export async function mpremoteRm(currentFolder: string, filename: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        const path = currentFolder ? `${currentFolder.replace(/\/$/, '')}/${filename}` : filename;
        exec(`mpremote rm :${path}`, (error, stdout, stderr) => {
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
export async function mpremoteRun(currentFolder: string, filename: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        const path = currentFolder ? `${currentFolder.replace(/\/$/, '')}/${filename}` : filename;
        console.log(`mpremote run ${path}`);
        exec(`mpremote run ${path}`, (error, stdout, stderr) => {
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
export async function mpremoteCp(currentFolder: string, localPath: string, filename: string = ""): Promise<string> {
    return await new Promise((resolve, reject) => {
		console.log('>> currentFolder', currentFolder);
        const dest = currentFolder ? `:${currentFolder.replace(/\/$/, '')}` : ':';
		console.log(`>> mpremote cp ${localPath} ${dest}`);
        exec(`mpremote cp ${localPath} ${dest}`, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            } else {
                resolve(stdout);
            }
        });
    });
}

export async function mpremoteCp2(currentFolder: string, remoteFromPath: string, remoteToPath: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        const from = currentFolder ? `:${currentFolder.replace(/\/$/, '')}/${remoteFromPath}` : `:${remoteFromPath}`;
        const to = currentFolder ? `:${currentFolder.replace(/\/$/, '')}/${remoteToPath}` : `:${remoteToPath}`;
        exec(`mpremote cp ${from} ${to}`, (error, stdout, stderr) => {
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
export async function mpremoteReset(currentFolder: string): Promise<string> {
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
