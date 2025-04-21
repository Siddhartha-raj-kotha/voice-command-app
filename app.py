from flask import Flask, render_template, send_from_directory, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(
    __name__,
    static_folder=None,  # disable default static handler
    template_folder="assistant/templates"
)

CORS(app)

# In-memory history storage
history_data = []

# --- ROUTES ---

# 🏠 Main index.html
@app.route('/')
def home():
    return send_from_directory('main', 'index.html')

# 🌐 Static files from /main (style.css, script.js)
@app.route('/main/<path:filename>')
def serve_main_static(filename):
    return send_from_directory('main', filename)

# 🤖 Assistant interface
@app.route('/assistant')
def assistant():
    return render_template('assistant.html')

# 🎨 Static files for assistant (CSS/JS)
@app.route('/static/<path:filename>')
def serve_assistant_static(filename):
    return send_from_directory('assistant/static', filename)

# --- API ENDPOINTS ---

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(history_data)

@app.route('/api/history', methods=['POST'])
def add_to_history():
    data = request.get_json()
    command = data.get('command')
    if command:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        history_data.append({'command': command, 'timestamp': timestamp})
        return jsonify({'message': 'Command added to history'}), 201
    return jsonify({'error': 'Missing command'}), 400

@app.route('/api/history/<int:index>', methods=['DELETE'])
def delete_history_entry(index):
    if 0 <= index < len(history_data):
        del history_data[index]
        return jsonify({'message': 'History entry deleted'})
    return jsonify({'error': 'Invalid index'}), 404

@app.route('/api/history/clear', methods=['DELETE'])
def clear_history():
    history_data.clear()
    return jsonify({'message': 'History cleared'})

# --- RUN ---
if __name__ == '__main__':
    app.run(debug=True)
