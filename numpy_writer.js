/**
 * NumPy .npy File Writer for JavaScript
 * ========================================
 * 
 * Creates proper NumPy .npy binary files from JavaScript arrays.
 * Compatible with np.load() in Python.
 */

class NumpyWriter {
    /**
     * Create a .npy file from a JavaScript typed array.
     * 
     * @param {TypedArray} data - The array data
     * @param {Array} shape - Shape of the array [dim0, dim1, ...]
     * @param {string} dtype - NumPy dtype string (e.g., '<f4', '<u1')
     * @returns {Blob} Binary blob in .npy format
     */
    static createNpyFile(data, shape, dtype = '<f4') {
        // NumPy .npy format header
        const magicString = '\x93NUMPY';
        const version = new Uint8Array([1, 0]); // Version 1.0
        
        // Create header dictionary
        const dtypeStr = dtype;
        const fortranOrder = false;
        const shapeStr = '(' + shape.join(', ') + (shape.length === 1 ? ',' : '') + ')';
        
        let header = `{'descr': '${dtypeStr}', 'fortran_order': ${fortranOrder}, 'shape': ${shapeStr}, }`;
        
        // Pad header to be divisible by 64 bytes (including magic, version, and length)
        const headerLen = magicString.length + version.length + 2; // +2 for header length field
        const totalHeaderLen = headerLen + header.length;
        const padding = (64 - (totalHeaderLen % 64)) % 64;
        header += ' '.repeat(padding);
        
        // Header length (little endian uint16)
        const headerLengthBytes = new Uint8Array(2);
        const headerLength = header.length;
        headerLengthBytes[0] = headerLength & 0xFF;
        headerLengthBytes[1] = (headerLength >> 8) & 0xFF;
        
        // Combine all parts
        const magicBytes = new TextEncoder().encode(magicString);
        const headerBytes = new TextEncoder().encode(header);
        
        // Create final array
        const totalSize = magicBytes.length + version.length + headerLengthBytes.length + headerBytes.length + data.byteLength;
        const result = new Uint8Array(totalSize);
        
        let offset = 0;
        result.set(magicBytes, offset);
        offset += magicBytes.length;
        result.set(version, offset);
        offset += version.length;
        result.set(headerLengthBytes, offset);
        offset += headerLengthBytes.length;
        result.set(headerBytes, offset);
        offset += headerBytes.length;
        result.set(new Uint8Array(data.buffer), offset);
        
        return new Blob([result], { type: 'application/octet-stream' });
    }
    
    /**
     * Create frames.npy file from collected frame data.
     * 
     * @param {Array} frames - Array of {data: Uint8Array, width, height, timestamp}
     * @returns {Blob} NumPy file with shape (N, H, W, 3)
     */
    static createFramesNpy(frames) {
        if (frames.length === 0) {
            console.warn('No frames to save');
            return null;
        }
        
        const numFrames = frames.length;
        const height = frames[0].height;
        const width = frames[0].width;
        const channels = 3;
        
        // Stack all frames into single array
        const totalSize = numFrames * height * width * channels;
        const allFrames = new Uint8Array(totalSize);
        
        let offset = 0;
        for (let i = 0; i < frames.length; i++) {
            allFrames.set(frames[i].data, offset);
            offset += frames[i].data.length;
        }
        
        // Shape: (N, H, W, 3)
        const shape = [numFrames, height, width, channels];
        
        // Create .npy file with uint8 dtype
        return this.createNpyFile(allFrames, shape, '|u1');
    }
    
    /**
     * Create timestamps.npy file.
     * 
     * @param {Array} timestamps - Array of timestamp values (milliseconds)
     * @returns {Blob} NumPy file with shape (N,)
     */
    static createTimestampsNpy(timestamps) {
        // Convert to Float32Array
        const timestampsArray = new Float32Array(timestamps);
        
        // Shape: (N,)
        const shape = [timestamps.length];
        
        // Create .npy file with float32 dtype
        return this.createNpyFile(timestampsArray, shape, '<f4');
    }
}

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NumpyWriter;
}

