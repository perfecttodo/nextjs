# FFmpeg.js Integration for M3U8 HLS Audio Recording

This project now includes a separate FFmpeg.js version for advanced audio recording with M3U8 HLS format support.

## 🚀 Features

### **FFmpeg Audio Recorder**
- **Multiple Output Formats**: Support for M3U8 (HLS), MP3, and M4A
- **HLS Streaming**: Creates M3U8 playlists with segmented TS files for adaptive streaming
- **Real-time Processing**: Audio is processed client-side using WebAssembly
- **Format Conversion**: Automatically converts from WebM to desired output format

### **Supported Output Formats**
1. **M3U8 (HLS)**: HTTP Live Streaming format with segmented audio files
2. **MP3**: Standard MP3 format for maximum compatibility
3. **M4A**: AAC-encoded audio in M4A container for quality

## 📦 Installation

The required dependencies are already installed:

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

## 🎯 Usage

### **Accessing the FFmpeg Recorder**

1. Navigate to `/user/audio` (Audio Management page)
2. Look for the **"FFmpeg Recorder"** tab (⚡ icon)
3. Select your desired output format
4. Click "Start Recording" to begin
5. Click "Stop Recording" when finished
6. Audio will be automatically processed with FFmpeg
7. Fill in the form fields and upload

### **Output Format Selection**

- **M3U8 (HLS)**: Best for streaming applications, creates multiple segments
- **MP3**: Universal compatibility, smaller file sizes
- **M4A**: High quality with AAC codec, good for mobile devices

## 🔧 Technical Implementation

### **FFmpeg Loading**
- Dynamically imports FFmpeg to avoid SSR issues
- Loads core files from CDN (unpkg.com)
- Uses WebAssembly for client-side processing

### **Audio Processing Pipeline**
1. **Recording**: Captures audio using MediaRecorder API
2. **Processing**: Converts WebM to selected format using FFmpeg
3. **Output**: Creates processed audio file with proper MIME type
4. **Upload**: 
   - **Standard formats (MP3/M4A)**: Single file upload via `/api/audio/upload`
   - **HLS format (M3U8)**: Multi-file upload via `/api/audio/upload-hls` (M3U8 + TS segments)

### **HLS Configuration**
For M3U8 output, the following FFmpeg parameters are used:
```bash
-i input.webm
-c:a aac          # Audio codec: AAC
-b:a 128k         # Bitrate: 128 kbps
-hls_time 2       # Segment duration: 2 seconds
-hls_list_size 0  # Keep all segments
-hls_segment_filename segment_%03d.ts
```

### **HLS Upload Process**
When M3U8 format is selected, the system automatically:

1. **Processes Audio**: Converts WebM recording to M3U8 + TS segments
2. **Collects Files**: Gathers M3U8 playlist and all TS segment files
3. **Uploads Separately**: Uses dedicated `/api/audio/upload-hls` endpoint
4. **Organizes Storage**: Creates organized folder structure in blob storage
5. **Database Entry**: Stores M3U8 playlist URL as main audio file reference

**File Structure in Storage:**
```
audio/{user_id}/{timestamp}-{title}/
├── playlist.m3u8          # Main playlist file
├── segment_000.ts         # Audio segment 1
├── segment_001.ts         # Audio segment 2
├── segment_002.ts         # Audio segment 3
└── ...                    # Additional segments
```

**Benefits:**
- **Streaming Ready**: M3U8 files work with HLS players and CDNs
- **Adaptive Bitrate**: Segments can be served at different quality levels
- **Scalable**: Easy to add more segments or modify existing ones
- **Compatible**: Works with major streaming platforms and players

## 🌐 Browser Compatibility

### **Required Features**
- **MediaRecorder API**: For audio recording
- **WebAssembly**: For FFmpeg processing
- **Modern Browser**: Chrome 67+, Firefox 60+, Safari 11.1+

### **Recommended Browsers**
- **Chrome/Edge**: Best performance and compatibility
- **Firefox**: Good performance, some features may be slower
- **Safari**: Limited WebAssembly support, may have issues

## 📱 Mobile Support

### **iOS Safari**
- Limited WebAssembly support
- May experience slower processing
- Audio recording works but processing may fail

### **Android Chrome**
- Full support for all features
- Good performance on modern devices
- Recommended for mobile use

## ⚠️ Known Limitations

### **File Size**
- Large recordings may cause memory issues
- Recommended maximum: 10-15 minutes
- Processing time increases with file size

### **Browser Memory**
- FFmpeg processing uses significant memory
- May cause issues on low-memory devices
- Consider closing other tabs during processing

### **Network Dependencies**
- Requires internet connection for initial FFmpeg loading
- CDN dependencies may cause loading failures
- Offline usage not supported

## 🛠️ Troubleshooting

### **FFmpeg Loading Failed**
1. Check internet connection
2. Refresh the page
3. Try a different browser
4. Clear browser cache

### **Recording Issues**
1. Check microphone permissions
2. Ensure microphone is not muted
3. Try refreshing the page
4. Check browser console for errors

### **Processing Errors**
1. Wait for FFmpeg to fully load
2. Try smaller recording duration
3. Check available memory
4. Restart browser if needed

## 🔮 Future Enhancements

### **Planned Features**
- **Custom FFmpeg Parameters**: User-configurable encoding options
- **Batch Processing**: Process multiple files simultaneously
- **Progress Indicators**: Real-time processing progress
- **Quality Presets**: Predefined encoding quality levels

### **Performance Improvements**
- **Web Workers**: Move processing to background threads
- **Streaming Processing**: Process audio in chunks
- **Caching**: Cache FFmpeg core files locally
- **Optimization**: Reduce memory usage and processing time

## 🔌 API Endpoints

### **Standard Audio Upload**
- **Endpoint**: `POST /api/audio/upload`
- **Purpose**: Upload single audio files (MP3, M4A, WAV, OGG, WebM)
- **Format**: Standard form data with single file

### **HLS Audio Upload**
- **Endpoint**: `POST /api/audio/upload-hls`
- **Purpose**: Upload M3U8 playlist + TS segment files
- **Format**: Form data with multiple files
- **Files**:
  - `m3u8File`: M3U8 playlist file
  - `tsFiles[]`: Array of TS segment files
  - Standard metadata fields (title, category, etc.)

### **Upload Flow**
```
FFmpeg Processing → File Collection → Format Detection → API Selection → Upload
     ↓                    ↓              ↓              ↓           ↓
  M3U8 + TS         Gather Files    M3U8 Format    HLS Endpoint   Storage
  MP3/M4A           Single File     MP3/M4A       Standard       Storage
```

## 📚 Additional Resources

### **FFmpeg.js Documentation**
- [Official FFmpeg.js Documentation](https://ffmpegwasm.net/)
- [GitHub Repository](https://github.com/ffmpegwasm/ffmpeg.wasm)
- [API Reference](https://ffmpegwasm.net/docs/api/)

### **HLS Streaming**
- [Apple HLS Documentation](https://developer.apple.com/documentation/http_live_streaming)
- [HLS Specification](https://tools.ietf.org/html/rfc8216)
- [M3U8 Format Guide](https://en.wikipedia.org/wiki/M3U8)

### **Web Audio APIs**
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [WebAssembly](https://webassembly.org/)
- [Audio Processing](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## 🤝 Contributing

To contribute to the FFmpeg integration:

1. Test on multiple browsers and devices
2. Report any compatibility issues
3. Suggest performance improvements
4. Help with documentation updates

## 📄 License

This FFmpeg integration follows the same license as the main project. FFmpeg.js is licensed under the Apache 2.0 License.
