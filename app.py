from flask import Flask, request, jsonify
from flask_cors import CORS
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

app = Flask(__name__)
CORS(app) 

# Configura tu archivo de credenciales de Google Service Account
SERVICE_ACCOUNT_FILE = 'credenciales.json' 
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SPREADSHEET_ID = '1zh5En4C6KyTajqt50pXTUQVuzxMTBOninxqLMngJngU'

def append_row(sheet_name, row_data):
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('sheets', 'v4', credentials=creds)
    sheet = service.spreadsheets()
    range_ = f"{sheet_name}!A1"
    body = {'values': [row_data]}
    result = sheet.values().append(
        spreadsheetId=SPREADSHEET_ID,
        range=range_,
        valueInputOption='RAW',
        body=body
    ).execute()
    return result

@app.route('/add', methods=['POST'])
def add_row():
    data = request.json
    sheet = request.args.get('sheet', 'Ingresos')
    if not isinstance(data, list):
        return jsonify({'error': 'Datos inválidos'}), 400
    try:
        append_row(sheet, data)
        return jsonify({'status': 'OK'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)