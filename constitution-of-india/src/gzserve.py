import http.server, gzip, os, sys
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path.split('?')[0])
        if os.path.isdir(path): path = os.path.join(path, 'index.html')
        if not os.path.isfile(path): return self.send_error(404)
        data = open(path, 'rb').read()
        ctype = self.guess_type(path)
        gz = 'gzip' in self.headers.get('Accept-Encoding', '')
        if gz: data = gzip.compress(data, 6)
        self.send_response(200); self.send_header('Content-Type', ctype)
        if gz: self.send_header('Content-Encoding', 'gzip')
        self.send_header('Content-Length', str(len(data))); self.send_header('Cache-Control', 'max-age=3600'); self.end_headers(); self.wfile.write(data)
    def log_message(self, *a): pass
os.chdir(sys.argv[1]); http.server.ThreadingHTTPServer(('', int(sys.argv[2])), H).serve_forever()
