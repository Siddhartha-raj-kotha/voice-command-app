from flask import Flask, request, jsonify, render_template
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow frontend to communicate with this backend

# In-memory history list
history_data = []

@app.route('/')
def index():
    return render_template('assistant.html')

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

if __name__ == '__main__':
    app.run(debug=True)
