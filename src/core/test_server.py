import http.server
import socketserver

PORT = 8080

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status": "OK", "message": "Python server working!"}')

with socketserver.TCPServer(("127.0.0.1", PORT), MyHandler) as httpd:
    print(f"🚀 Python server running on port {PORT}")
    print(f"🌐 Try: http://127.0.0.1:{PORT}")
    httpd.serve_forever()
