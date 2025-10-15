# app.py (modified backend)
# -*- mode: python ; coding: utf-8 -*-
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import os
import sys
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from werkzeug.utils import secure_filename
import json
import secrets
import hashlib
import bcrypt
import socket
import uuid
import time
import threading
import traceback
from functools import wraps
import jwt
import requests
from io import BytesIO
# Optional dependencies
try:
    import openpyxl
except ImportError:
    openpyxl = None
    logging.warning("openpyxl library not found. Excel export/backup features will be disabled.")
try:
    import schedule
except ImportError:
    schedule = None
    logging.warning("schedule library not found. Automatic tasks will be disabled.")
# SQLite import
import sqlite3
# --- Configuration Management ---
def get_base_dir():
    """Determine the base directory, handling both development and frozen executable cases."""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.getenv('CONFIG_DIR', get_base_dir())
os.makedirs(CONFIG_DIR, exist_ok=True)
CONFIG_FILE_PATH = os.path.join(CONFIG_DIR, 'config.json')
BASE_DIR = get_base_dir()
STATIC_FOLDER_PATH = os.path.join(BASE_DIR, 'dist')
app = Flask(__name__, static_folder=STATIC_FOLDER_PATH, static_url_path='/')
CORS(app, resources={r"/api/*": {"origins": "*"}})
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(CONFIG_DIR, 'pos_app.log'))
    ]
)
logger = logging.getLogger(__name__)
JWT_SECRET = os.getenv('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = 'HS256'
JWT_EXP_DELTA_SECONDS = 3600
def load_config():
    """Loads the configuration from config.json, creating a default if it doesn't exist."""
    try:
        if not os.path.exists(CONFIG_FILE_PATH):
            logger.warning(f"config.json not found at {CONFIG_FILE_PATH}. Creating default configuration.")
            default_config = {
                "mode": "server",
                "server_ip": "127.0.0.1"
            }
            save_config(default_config)
            return default_config
        with open(CONFIG_FILE_PATH, 'r') as f:
            logger.info(f"Loading configuration from {CONFIG_FILE_PATH}")
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, PermissionError) as e:
        logger.error(f"Could not load or parse config.json: {e}. Using default server config.")
        return {"mode": "server", "server_ip": "127.0.0.1"}
def save_config(config_data):
    """Saves the configuration to config.json."""
    try:
        with open(CONFIG_FILE_PATH, 'w') as f:
            json.dump(config_data, f, indent=4)
        logger.info(f"Configuration saved to {CONFIG_FILE_PATH}")
    except PermissionError as e:
        logger.error(f"Permission denied when saving config.json to {CONFIG_FILE_PATH}: {e}")
        raise
    except Exception as e:
        logger.error(f"Error saving config.json: {e}")
        raise
config = load_config()
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(BASE_DIR, 'static', 'uploads'))
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp','jfif'}
ALLOWED_JSON_EXTENSIONS = {'json'}
MAX_BACKUPS = 10
def create_directory(directory):
    """Ensure directory exists."""
    try:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Ensured directory exists: {directory}")
    except Exception as e:
        logger.error(f"Error creating directory {directory}: {e}")
create_directory(app.config['UPLOAD_FOLDER'])
conn = None
class SQLiteCollection:
    def __init__(self, conn, name):
        self.conn = conn
        self.name = name

    def matches_filter(self, d, filter_):
        if not filter_:
            return True
        for key, value in filter_.items():
            if key == '$or':
                if not any(self.matches_filter(d, subfilter) for subfilter in value):
                    return False
            else:
                if d.get(key) != value:
                    return False
        return True

    def insert_one(self, doc):
        if '_id' not in doc:
            doc['_id'] = str(uuid.uuid4())
        json_doc = json.dumps(document_to_dict(doc))
        cur = self.conn.cursor()
        cur.execute(f"INSERT INTO {self.name} (id, data) VALUES (?, ?)", (doc['_id'], json_doc))
        self.conn.commit()
        return type('InsertResult', (), {'inserted_id': doc['_id']})()

    def find(self, filter=None):
        cur = self.conn.cursor()
        rows = cur.execute(f"SELECT data FROM {self.name}").fetchall()
        docs = [json.loads(row[0]) for row in rows]
        if filter:
            docs = [d for d in docs if self.matches_filter(d, filter)]
        return docs

    def find_one(self, filter):
        rows = self.conn.execute(f"SELECT data FROM {self.name}").fetchall()
        for row in rows:
            d = json.loads(row[0])
            if self.matches_filter(d, filter):
                return d
        return None

    def update_one(self, filter, update, array_filters=None):
        cur = self.conn.cursor()
        rows = cur.execute(f"SELECT id, data FROM {self.name}").fetchall()
        matched = False
        for row_id, row_data in rows:
            d = json.loads(row_data)
            if self.matches_filter(d, filter):
                matched = True
                if '$set' in update:
                    for k, v in update['$set'].items():
                        if '.' in k:
                            parts = k.split('.')
                            current = d
                            for part in parts[:-1]:
                                if part.isdigit():
                                    part = int(part)
                                if part not in current:
                                    current[part] = {} if not part.isdigit() else []
                                current = current[part]
                            current[parts[-1]] = v
                        else:
                            d[k] = v
                if '$unset' in update:
                    for k in update['$unset']:
                        if '.' in k:
                            parts = k.split('.')
                            current = d
                            for part in parts[:-1]:
                                if part.isdigit():
                                    part = int(part)
                                current = current[part]
                            current.pop(parts[-1], None)
                        else:
                            d.pop(k, None)
                if '$inc' in update:
                    for k, v in update['$inc'].items():
                        if '.' in k:
                            parts = k.split('.')
                            current = d
                            for part in parts[:-1]:
                                if part.isdigit():
                                    part = int(part)
                                if part not in current:
                                    current[part] = {} if not part.isdigit() else []
                                current = current[part]
                            current[parts[-1]] = current.get(parts[-1], 0) + v
                        else:
                            d[k] = d.get(k, 0) + v
                if '$pull' in update:
                    for k, v in update['$pull'].items():
                        if isinstance(d.get(k), list):
                            d[k] = [i for i in d[k] if i != v]
                if array_filters:
                    for uk, uv in update['$set'].items():
                        if '$[elem]' in uk:
                            array_name, rest = uk.split('.$[elem].', 1)
                            array = d.get(array_name, [])
                            af = array_filters[0]
                            af_key = list(af.keys())[0].split('.')[-1]
                            af_value = af[list(af.keys())[0]]
                            for elem in array:
                                if elem.get(af_key) == af_value:
                                    elem[rest] = uv
                json_doc = json.dumps(document_to_dict(d))
                cur.execute(f"UPDATE {self.name} SET data = ? WHERE id = ?", (json_doc, row_id))
                self.conn.commit()
                return type('UpdateResult', (), {'matched_count': 1, 'modified_count': 1})()
        return type('UpdateResult', (), {'matched_count': 0, 'modified_count': 0})()

    def update_many(self, filter, update):
        cur = self.conn.cursor()
        rows = cur.execute(f"SELECT id, data FROM {self.name}").fetchall()
        modified_count = 0
        for row_id, row_data in rows:
            d = json.loads(row_data)
            if self.matches_filter(d, filter):
                if '$set' in update:
                    for k, v in update['$set'].items():
                        if '.' in k:
                            parts = k.split('.')
                            current = d
                            for part in parts[:-1]:
                                if part.isdigit():
                                    part = int(part)
                                if part not in current:
                                    current[part] = {} if not part.isdigit() else []
                                current = current[part]
                            current[parts[-1]] = v
                        else:
                            d[k] = v
                json_doc = json.dumps(document_to_dict(d))
                cur.execute(f"UPDATE {self.name} SET data = ? WHERE id = ?", (json_doc, row_id))
                modified_count += 1
        self.conn.commit()
        return type('UpdateResult', (), {'modified_count': modified_count})()

    def delete_one(self, filter):
        cur = self.conn.cursor()
        rows = cur.execute(f"SELECT id, data FROM {self.name}").fetchall()
        for row_id, row_data in rows:
            d = json.loads(row_data)
            if self.matches_filter(d, filter):
                cur.execute(f"DELETE FROM {self.name} WHERE id = ?", (row_id,))
                self.conn.commit()
                return type('DeleteResult', (), {'deleted_count': 1})()
        return type('DeleteResult', (), {'deleted_count': 0})()

    def replace_one(self, filter, replacement, upsert=False):
        cur = self.conn.cursor()
        rows = cur.execute(f"SELECT id, data FROM {self.name}").fetchall()
        matched = False
        for row_id, row_data in rows:
            d = json.loads(row_data)
            if self.matches_filter(d, filter):
                matched = True
                json_doc = json.dumps(document_to_dict(replacement))
                cur.execute(f"UPDATE {self.name} SET data = ? WHERE id = ?", (json_doc, row_id))
                self.conn.commit()
                return type('UpdateResult', (), {'matched_count': 1, 'modified_count': 1})()
        if upsert:
            self.insert_one(replacement)
            return type('UpdateResult', (), {'matched_count': 0, 'modified_count': 1})()
        return type('UpdateResult', (), {'matched_count': 0, 'modified_count': 0})()

    def find_one_and_update(self, filter, update, upsert=False, return_document=True):
        cur = self.conn.cursor()
        rows = cur.execute(f"SELECT id, data FROM {self.name}").fetchall()
        matched = False
        for row_id, row_data in rows:
            d = json.loads(row_data)
            if self.matches_filter(d, filter):
                matched = True
                old_d = d.copy()
                if '$inc' in update:
                    for k, v in update['$inc'].items():
                        d[k] = d.get(k, 0) + v
                json_doc = json.dumps(document_to_dict(d))
                cur.execute(f"UPDATE {self.name} SET data = ? WHERE id = ?", (json_doc, row_id))
                self.conn.commit()
                if return_document:
                    return d
                else:
                    return old_d
        if upsert:
            doc = filter.copy()
            if '$inc' in update:
                for k, v in update['$inc'].items():
                    doc[k] = doc.get(k, 0) + v
            self.insert_one(doc)
            return doc
        return None
def connect_to_sqlite():
    global conn, items_collection, customers_collection, sales_collection, tables_collection, users_collection, settings_collection, email_tokens_collection, opening_collection, pos_closing_collection, kitchens_collection, item_groups_collection, kitchen_saved_collection, picked_up_collection, variants_collection, employees_collection, activeorders_collection, order_counters_collection, tripreports_collection, email_settings_collection, purchase_items_collection, suppliers_collection, purchase_orders_collection, purchase_receipts_collection, purchase_invoices_collection, uoms_collection, purchase_sales_collection, print_settings_collection, combo_offers_collection, vat_collection, customer_groups_collection, company_details_collection
    mode = config.get("mode", "server")
    if mode == 'server':
        db_path = os.path.join(CONFIG_DIR, 'restaurant.db')
        conn = sqlite3.connect(db_path, check_same_thread=False)
        cur = conn.cursor()
        tables = [
            'active_orders', 'combo_offers', 'customers', 'email_settings', 'email_tokens', 'employees', 'item_groups', 'items', 'kitchen_saved_orders', 'kitchens',
            'order_counters', 'picked_up_items', 'pos_closing_entries', 'pos_opening_entries', 'print_settings', 'purchase_invoices', 'purchase_items', 'purchase_orders',
            'purchase_receipts', 'purchase_sales', 'sales', 'suppliers', 'system_settings', 'tables', 'trip_reports', 'uoms', 'users', 'variants', 'vat', 'customer_groups', 'company_details' # NEW: customer_groups
        ]
        for table in tables:
            cur.execute(f"CREATE TABLE IF NOT EXISTS {table} (id TEXT PRIMARY KEY, data TEXT)")
        conn.commit()
        logger.info(f"Successfully connected to SQLite at {db_path}")
        items_collection = SQLiteCollection(conn, 'items')
        customers_collection = SQLiteCollection(conn, 'customers')
        sales_collection = SQLiteCollection(conn, 'sales')
        tables_collection = SQLiteCollection(conn, 'tables')
        users_collection = SQLiteCollection(conn, 'users')
        settings_collection = SQLiteCollection(conn, 'system_settings')
        email_tokens_collection = SQLiteCollection(conn, 'email_tokens')
        opening_collection = SQLiteCollection(conn, 'pos_opening_entries')
        pos_closing_collection = SQLiteCollection(conn, 'pos_closing_entries')
        kitchens_collection = SQLiteCollection(conn, 'kitchens')
        item_groups_collection = SQLiteCollection(conn, 'item_groups')
        kitchen_saved_collection = SQLiteCollection(conn, 'kitchen_saved_orders')
        picked_up_collection = SQLiteCollection(conn, 'picked_up_items')
        variants_collection = SQLiteCollection(conn, 'variants')
        employees_collection = SQLiteCollection(conn, 'employees')
        activeorders_collection = SQLiteCollection(conn, 'active_orders')
        order_counters_collection = SQLiteCollection(conn, 'order_counters')
        tripreports_collection = SQLiteCollection(conn, 'trip_reports')
        email_settings_collection = SQLiteCollection(conn, 'email_settings')
        purchase_items_collection = SQLiteCollection(conn, 'purchase_items')
        suppliers_collection = SQLiteCollection(conn, 'suppliers')
        purchase_orders_collection = SQLiteCollection(conn, 'purchase_orders')
        purchase_receipts_collection = SQLiteCollection(conn, 'purchase_receipts')
        purchase_invoices_collection = SQLiteCollection(conn, 'purchase_invoices')
        uoms_collection = SQLiteCollection(conn, 'uoms')
        purchase_sales_collection = SQLiteCollection(conn, 'purchase_sales')
        print_settings_collection = SQLiteCollection(conn, 'print_settings')
        combo_offers_collection = SQLiteCollection(conn, 'combo_offers')
        vat_collection = SQLiteCollection(conn, 'vat')
        customer_groups_collection = SQLiteCollection(conn, 'customer_groups')  # NEW: customer_groups_collection
        company_details_collection = SQLiteCollection(conn, 'company_details')
        ensure_test_users()
        return True
    else:
        logger.info(f"Client mode: No local database connection")
        conn = None
        return True # Allow client mode without local DB
def ensure_test_users():
    for test_user_template in TEST_USERS:
        email = test_user_template['email']
        user = users_collection.find_one({"email": email})
        new_hash = bcrypt.hashpw("123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        test_user = {**test_user_template, "password": new_hash}
        if user:
            if 'firstName' not in user:
                users_collection.update_one({"email": email}, {"$set": {"firstName": test_user['firstName']}})
                logger.warning(f"Added missing 'firstName' for user {email}")
            try:
                bcrypt.checkpw(b"123", user['password'].encode('utf-8'))
            except ValueError as ve:
                logger.warning(f"Invalid hash for user {email}, rehashing: {ve}")
                users_collection.update_one({"email": email}, {"$set": {"password": new_hash}})
            except Exception as e:
                logger.error(f"Error checking hash for {email}: {e}")
        else:
            users_collection.insert_one(test_user)
            logger.info(f"Inserted test user {email}")
def db_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        mode = config.get("mode", "server")
        if mode == 'client':
            return f(*args, **kwargs)
        if conn is None:
            error_msg = "Cannot connect to database. Please check the database configuration."
            logger.error(error_msg)
            return jsonify({"error": error_msg, "message": "Database not connected."}), 503
        return f(*args, **kwargs)
    return decorated_function
# Proxy for client mode - Add this to proxy all /api/* except local ones
if config.get('mode') == 'client':
    @app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    def proxy_api(path):
        if path in ['configure', 'network_info']: # Handle local routes without proxy
            return "Local route in client mode", 200
        server_url = f"http://{config['server_ip']}:8000/api/{path}"
        if request.method == 'OPTIONS':
            response = jsonify({"success": True})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            return response
        try:
            resp = requests.request(
                method=request.method,
                url=server_url,
                headers={k: v for k, v in request.headers if k != 'Host'},
                data=request.get_data(),
                cookies=request.cookies,
                allow_redirects=False,
                stream=True
            )
            excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
            headers = [(name, value) for (name, value) in resp.raw.headers.items() if name.lower() not in excluded_headers]
            response = Response(resp.content, resp.status_code, headers)
            return response
        except Exception as e:
            logger.error(f"Proxy error: {str(e)}")
            return jsonify({"error": str(e)}), 503 # Change to 503 for service unavailable
def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
def handle_image_upload(file):
    if file and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{ext}"
        filename = secure_filename(unique_filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        logger.info(f"Image saved: {filename}")
        return filename
    logger.warning(f"Invalid file for upload: {file.filename}")
    return None
def sanitize_image_fields(data):
    fields_to_sanitize = ['image', 'addon_image', 'combo_image', 'variant_image']
    for field in fields_to_sanitize:
        if field in data and isinstance(data[field], str):
            data[field] = os.path.basename(data[field])
    for addon in data.get("addons", []):
        if 'addon_image' in addon and isinstance(addon['addon_image'], str):
            addon['addon_image'] = os.path.basename(addon['addon_image'])
    for combo in data.get("combos", []):
        if 'combo_image' in combo and isinstance(combo['combo_image'], str):
            combo['combo_image'] = os.path.basename(combo['combo_image'])
    return data
def convert_objectid_to_str(item):
    if isinstance(item, list):
        return [convert_objectid_to_str(i) for i in item]
    if isinstance(item, dict):
        return {key: convert_objectid_to_str(value) for key, value in item.items()}
    if isinstance(item, datetime):
        return item.isoformat()
    return item
def get_system_settings():
    if settings_collection is None:
        logger.warning("Settings collection not available, returning default settings")
        return {
            "_id": "system_settings",
            "disableUserPassLogin": False,
            "allowLoginUsingMobileNumber": True,
            "allowLoginUsingUsername": True,
            "loginWithEmailLink": False,
            "sessionExpiry": "06:00",
            "backup_interval_hours": 6
        }
    settings = settings_collection.find_one({"_id": "system_settings"})
    if not settings:
        default_settings = {
            "_id": "system_settings",
            "disableUserPassLogin": False,
            "allowLoginUsingMobileNumber": True,
            "allowLoginUsingUsername": True,
            "loginWithEmailLink": False,
            "sessionExpiry": "06:00",
            "backup_interval_hours": 6
        }
        settings_collection.insert_one(default_settings)
        logger.info("Inserted default system settings")
        return default_settings
    return settings
def save_system_settings(settings):
    settings["_id"] = "system_settings"
    settings_collection.replace_one({"_id": "system_settings"}, settings, upsert=True)
    logger.info("System settings saved")
TEST_USERS = [
    {
        "email": "admin@gmail.com",
        "password": bcrypt.hashpw("123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "phone_number": "1234567890",
        "username": "admin",
        "role": "admin",
        "firstName": "Admin",
        "company": "POS 8",
        "pos_profile": "POS-001",
        "status": "Active",
        "created_at": datetime.now(ZoneInfo("UTC")).isoformat(),
        "is_test": True
    },
    {
        "email": "bearer@gmail.com",
        "password": bcrypt.hashpw("123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "phone_number": "0987654321",
        "username": "bearer",
        "role": "bearer",
        "firstName": "Bearer",
        "company": "POS 8",
        "pos_profile": "POS-001",
        "status": "Active",
        "created_at": datetime.now(ZoneInfo("UTC")).isoformat(),
        "is_test": True
    }
]
def to_json_safe(data):
    """Recursively converts documents to JSON-serializable format."""
    if isinstance(data, list):
        return [to_json_safe(item) for item in data]
    if isinstance(data, dict):
        return {key: to_json_safe(value) for key, value in data.items()}
    if isinstance(data, datetime):
        return data.isoformat()
    return data
def document_to_dict(doc):
    if isinstance(doc, list):
        return [document_to_dict(v) for v in doc]
    if isinstance(doc, dict):
        return {key: document_to_dict(value) for key, value in doc.items()}
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc
# --- Local Routes (available in both modes) ---
@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({"status": "success", "message": "Server is running"}), 200
@app.route('/api/network_info', methods=['GET'])
def get_network_info():
    current_config = load_config()
    mode = current_config.get("mode", "server")
    server_ip = current_config.get("server_ip", "127.0.0.1")
    db_status = "Disconnected"
    if mode == 'server':
        db_status = "Connected" if conn is not None else "Disconnected"
    else: # client mode
        try:
            r = requests.get(f"http://{server_ip}:8000/api/test", timeout=1)
            db_status = "Connected" if r.status_code == 200 else "Disconnected"
        except:
            db_status = "Disconnected"
    local_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.1)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
        except Exception:
            logger.warning("Could not determine local IP")
    return jsonify({
        "local_ip": local_ip,
        "config": current_config,
        "database_status": db_status
    }), 200
@app.route('/api/configure', methods=['POST'])
def configure_app():
    global config
    try:
        data = request.get_json()
        mode = data.get('mode')
        server_ip = data.get('server_ip')
        if mode not in ['server', 'client']:
            logger.error(f"Invalid mode specified: {mode}")
            return jsonify({"error": "Invalid mode specified. Must be 'server' or 'client'"}), 400
        if mode == 'client' and not server_ip:
            logger.error("Server IP not provided in client mode")
            return jsonify({"error": "Server IP is required for client mode"}), 400
        old_mode = config.get("mode", "server")
        new_config = {"mode": mode}
        if mode == 'client':
            new_config['server_ip'] = server_ip
        else:
            new_config['server_ip'] = "127.0.0.1"
        save_config(new_config)
        config = new_config
        success = connect_to_sqlite()
        mode_changed = old_mode != mode
        if mode == 'server' and not success:
            logger.error("Failed to connect to SQLite after configuration change")
            return jsonify({"error": "Failed to connect to SQLite with new configuration"}), 503
        logger.info(f"Application configured as {mode}")
        return jsonify({"message": "Configuration saved successfully. The application will now use the new settings.", "mode_changed": mode_changed}), 200
    except Exception as e:
        logger.error(f"Configuration error: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"An internal server error occurred during configuration: {str(e)}"}), 500
@app.route('/api/upload-image', methods=['POST', 'OPTIONS'])
def upload_image():
    if request.method == 'OPTIONS':
        response = jsonify({"success": True})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response, 200
    try:
        mode = config.get("mode", "server")
        if mode == 'client':
            files = {}
            for file in request.files.getlist('files'):
                files[file.filename] = (file.filename, file.stream.read(), file.content_type)
            server_url = f"http://{config['server_ip']}:8000/api/upload-image"
            response = requests.post(server_url, files=files)
            if response.status_code == 200:
                data = response.json()
                data['urls'] = [f"http://{config['server_ip']}:8000{url}" for url in data['urls']]
                return jsonify(data), 200
            else:
                logger.error(f"Proxy upload failed: {response.text}")
                return jsonify({"error": "Proxy upload failed"}), response.status_code
        else:
            if 'files' not in request.files:
                logger.error("No files part in request")
                return jsonify({"error": "No files provided"}), 400
            files = request.files.getlist('files')
            if not files or all(file.filename == '' for file in files):
                logger.error("No valid files selected")
                return jsonify({"error": "No valid files selected"}), 400
            urls = []
            for file in files:
                if file and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
                    filename = handle_image_upload(file)
                    if filename:
                        urls.append(f"/api/images/{filename}")
                        logger.info(f"Uploaded image: {filename}")
                    else:
                        logger.warning(f"Failed to upload image: {file.filename}")
                else:
                    logger.warning(f"Invalid file type: {file.filename}")
            if not urls:
                return jsonify({"error": "No valid images uploaded"}), 400
            return jsonify({"urls": urls}), 200
    except Exception as e:
        logger.error(f"Error uploading images: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
@app.route('/api/delete-image/<filename>', methods=['DELETE', 'OPTIONS'])
def delete_image(filename):
    if request.method == 'OPTIONS':
        response = jsonify({"success": True})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response, 200
    try:
        mode = config.get("mode", "server")
        if mode == 'client':
            server_url = f"http://{config['server_ip']}:8000/api/delete-image/{filename}"
            response = requests.delete(server_url, params=request.args)
            if response.status_code == 200:
                return jsonify(response.json()), 200
            else:
                logger.error(f"Proxy delete failed: {response.text}")
                return jsonify({"error": "Proxy delete failed"}), response.status_code
        else:
            item_id = request.args.get('item_id')
            field = request.args.get('field', 'image')
            valid_fields = {'image', 'images', 'addon_image', 'combo_image', 'variant_image'}
            if field not in valid_fields:
                logger.error(f"Invalid field specified: {field}")
                return jsonify({"error": f"Invalid field: {field}. Must be one of {valid_fields}"}), 400
            if not item_id:
                logger.error("Item ID is required for image deletion")
                return jsonify({"error": "Item ID is required"}), 400
            filename = secure_filename(filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if field == 'images':
                result = items_collection.update_one(
                    {"_id": item_id, "images": filename},
                    {"$pull": {"images": filename}}
                )
                if result.modified_count == 0:
                    logger.warning(f"Image {filename} not found in images array for item {item_id}")
                    return jsonify({"error": "Image not found in item"}), 404
            elif field == 'image':
                result = items_collection.update_one(
                    {"_id": item_id, "image": filename},
                    {"$set": {"image": None}}
                )
                if result.modified_count == 0:
                    logger.warning(f"Image {filename} not found in image field for item {item_id}")
                    return jsonify({"error": "Image not found in item"}), 404
            elif field == 'addon_image':
                result = items_collection.update_one(
                    {"_id": item_id, "addons.addon_image": filename},
                    {"$set": {"addons.$[elem].addon_image": None}},
                    array_filters=[{"elem.addon_image": filename}]
                )
                if result.modified_count == 0:
                    logger.warning(f"Image {filename} not found in addons for item {item_id}")
                    return jsonify({"error": "Image not found in addons"}), 404
            elif field == 'combo_image':
                result = items_collection.update_one(
                    {"_id": item_id, "combos.combo_image": filename},
                    {"$set": {"combos.$[elem].combo_image": None}},
                    array_filters=[{"elem.combo_image": filename}]
                )
                if result.modified_count == 0:
                    logger.warning(f"Image {filename} not found in combos for item {item_id}")
                    return jsonify({"error": "Image not found in combos"}), 404
            elif field == 'variant_image':
                result = items_collection.update_one(
                    {"_id": item_id, "variants.variant_image": filename},
                    {"$set": {"variants.$[elem].variant_image": None}},
                    array_filters=[{"elem.variant_image": filename}]
                )
                if result.modified_count == 0:
                    logger.warning(f"Image {filename} not found in variants for item {item_id}")
                    return jsonify({"error": "Image not found in variants"}), 404
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Image deleted from filesystem: {filename}")
                except PermissionError as e:
                    logger.error(f"Permission denied deleting image {filename}: {str(e)}")
                    return jsonify({"error": "Permission denied deleting image"}), 403
                except Exception as e:
                    logger.error(f"Error deleting image {filename}: {str(e)}")
                    return jsonify({"error": "Error deleting image"}), 500
            else:
                logger.warning(f"Image file not found on filesystem: {filename}")
            logger.info(f"Image {filename} deleted from {field} for item {item_id}")
            return jsonify({"message": "Image deleted successfully"}), 200
    except Exception as e:
        logger.error(f"Error deleting image {filename} for item {item_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500
@app.route('/api/images/<path:filename>', methods=['GET'])
def serve_uploaded_image(filename):
    logger.debug(f"Serving image: {filename}")
    try:
        mode = config.get("mode", "server")
        if mode == 'client':
            server_url = f"http://{config['server_ip']}:8000/api/images/{filename}"
            response = requests.get(server_url, stream=True)
            if response.status_code == 200:
                headers = {k: v for k, v in response.headers.items() if k.lower() in ('content-type', 'content-length')}
                return Response(response.iter_content(chunk_size=8192), headers=headers, status=200)
            else:
                return jsonify({"error": "Image not found"}), 404
        else:
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        logger.error(f"Error serving image {filename}: {str(e)}")
        return jsonify({"error": "Image not found"}), 404
@app.route('/api/import-mongodb', methods=['POST', 'OPTIONS'])
@db_required
def import_mongodb():
    if request.method == 'OPTIONS':
        response = jsonify({"success": True})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
        return response, 200
    try:
        if 'file' not in request.files:
            logger.error("No file part in request")
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files['file']
        if file.filename == '':
            logger.error("No selected file")
            return jsonify({"error": "No selected file"}), 400
        if not allowed_file(file.filename, ALLOWED_JSON_EXTENSIONS):
            logger.error(f"Invalid file type: {file.filename}")
            return jsonify({"error": "Only JSON files are allowed"}), 400
        filename = secure_filename(file.filename)
        collection_name = filename.rsplit('.', 1)[0].split('.')[-1]
        valid_collections = [
            'users', 'tables', 'items', 'customers', 'sales',
            'picked_up_items', 'pos_opening_entries', 'pos_closing_entries',
            'system_settings', 'kitchens', 'item_groups', 'customer_groups' # NEW: customer_groups
        ]
        if collection_name not in valid_collections:
            logger.error(f"Invalid collection name: {collection_name}")
            return jsonify({"error": f"Unsupported collection name: {collection_name}"}), 400
        target_collection = SQLiteCollection(conn, collection_name)
        data = json.loads(file.read().decode('utf-8'))
        if not isinstance(data, list):
            logger.error("JSON data must be an array")
            return jsonify({"error": "JSON data must be an array"}), 400
        inserted_count = 0
        for record in data:
            if '_id' in record:
                record['_id'] = str(record['_id'])
            record['imported_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
            unique_key = (
                {'_id': record.get('_id')} if '_id' in record else
                {'email': record.get('email')} if collection_name == 'users' else
                {'table_number': record.get('table_number')} if collection_name == 'tables' else
                {'item_name': record.get('item_name')} if collection_name == 'items' else
                {'phone_number': record.get('phone_number')} if collection_name == 'customers' else
                {'invoice_no': record.get('invoice_no')} if collection_name == 'sales' else
                {'customerName': record.get('customerName')} if collection_name == 'picked_up_items' else
                {'name': record.get('name')} if collection_name in ['pos_opening_entries', 'pos_closing_entries'] else
                {'kitchen_name': record.get('kitchen_name')} if collection_name == 'kitchens' else
                {'group_name': record.get('group_name')} if collection_name == 'item_groups' else
                {'group_name': record.get('group_name')} if collection_name == 'customer_groups' else # NEW: for customer_groups
                {}
            )
            if not unique_key:
                logger.error(f"No unique key defined for record in collection {collection_name}")
                return jsonify({"error": f"No unique key defined for record in collection {collection_name}"}), 400
            target_collection.replace_one(unique_key, record, upsert=True)
            inserted_count += 1
        logger.info(f"Imported {inserted_count} records into {collection_name}")
        return jsonify({"message": f"Successfully imported {inserted_count} records into {collection_name}"}), 200
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format in file {filename}: {str(e)}")
        return jsonify({"error": f"Invalid JSON format: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Error importing data: {str(e)}")
        return jsonify({"error": str(e)}), 500
@app.route('/api/save-email-settings', methods=['POST'])
@db_required
def save_email_settings():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        from_email = data.get('from_email')
        if not all([email, password, from_email]):
            return jsonify({"error": "Missing required fields: email, password, from_email"}), 400
        settings = {
            '_id': 'email_settings',
            'email': email,
            'password': password,
            'from_email': from_email,
            'updated_at': datetime.now(ZoneInfo("UTC")).isoformat()
        }
        email_settings_collection.replace_one({'_id': 'email_settings'}, settings, upsert=True)
        logger.info(f"Email settings saved for {email}")
        return jsonify({"success": True, "message": "Email settings saved successfully"}), 200
    except Exception as e:
        logger.error(f"Error saving email settings: {str(e)}")
        return jsonify({"error": f"Failed to save email settings: {str(e)}"}), 500
@app.route('/api/get-email-settings', methods=['GET'])
@db_required
def get_email_settings():
    try:
        settings = email_settings_collection.find_one({'_id': 'email_settings'})
        if not settings:
            return jsonify({"success": False, "error": "No email settings found"}), 404
        return jsonify({"success": True, "email": settings.get('email'), "from_email": settings.get('from_email')}), 200
    except Exception as e:
        logger.error(f"Error retrieving email settings: {str(e)}")
        return jsonify({"success": False, "error": f"Failed to retrieve email settings: {str(e)}"}), 500
@app.route('/api/test-email-settings', methods=['POST'])
@db_required
def test_email_settings():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        if not all([email, password]):
            return jsonify({"success": False, "error": "Missing required fields: email, password"}), 400
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(email, password)
        logger.info(f"SMTP authentication successful for {email}")
        return jsonify({"success": True, "message": "Email settings are valid"}), 200
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error during test: {str(e)}")
        return jsonify({"success": False, "error": "Invalid email or app password. Please check your credentials and ensure an App Password is used for Gmail."}), 401
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error during test: {str(e)}")
        return jsonify({"success": False, "error": f"SMTP error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Unexpected error testing email settings: {str(e)}")
        return jsonify({"success": False, "error": f"Failed to test email settings: {str(e)}"}), 500
@app.route('/api/send-email', methods=['POST', 'OPTIONS'])
@db_required
def send_email():
    if request.method == 'OPTIONS':
        response = jsonify({"success": True})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response, 200
    try:
        data = request.get_json()
        logger.info(f"Received email request: {data}")
        if not data:
            logger.error("No data received in send-email request")
            return jsonify({"success": False, "message": "No data provided"}), 400
        to_email = data.get('to')
        subject = data.get('subject')
        html_content = data.get('html')
        if not all([to_email, subject, html_content]):
            logger.error("Missing required email fields")
            return jsonify({"success": False, "message": "Missing required fields: to, subject, html"}), 400
        settings = email_settings_collection.find_one({'_id': 'email_settings'})
        if not settings:
            logger.error("No email settings configured")
            return jsonify({"success": False, "message": "Email settings not configured. Please configure in Email Settings."}), 500
        email_user = settings.get('email')
        email_pass = settings.get('password')
        from_email = settings.get('from_email')
        msg = MIMEMultipart('alternative')
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(email_user, email_pass)
            server.send_message(msg)
            logger.info(f"Email sent successfully to {to_email}")
        return jsonify({"success": True, "message": "Email sent successfully"}), 200
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {str(e)}")
        return jsonify({"success": False, "message": "Invalid email or app password. Please check your Email Settings and ensure an App Password is used for Gmail."}), 401
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
        return jsonify({"success": False, "message": f"SMTP error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Unexpected error sending email: {str(e)}")
        return jsonify({"success": False, "message": f"Failed to send email: {str(e)}"}), 500
@app.route('/api/export-all-to-excel', methods=['GET'])
@db_required
def export_all_to_excel():
    """Export all data to an Excel file."""
    try:
        if openpyxl is None:
            logger.error("openpyxl not installed")
            return jsonify({"error": "Excel export not available. Please install openpyxl library."}), 500
        wb = openpyxl.Workbook()
        wb.remove(wb.active)
        collections = {
            'active_orders': activeorders_collection,
            'combo_offers': combo_offers_collection,
            'customers': customers_collection,
            'email_settings': email_settings_collection,
            'email_tokens': email_tokens_collection,
            'employees': employees_collection,
            'item_groups': item_groups_collection,
            'items': items_collection,
            'kitchen_saved_orders': kitchen_saved_collection,
            'kitchens': kitchens_collection,
            'order_counters': order_counters_collection,
            'picked_up_items': picked_up_collection,
            'pos_closing_entries': pos_closing_collection,
            'pos_opening_entries': opening_collection,
            'print_settings': print_settings_collection,
            'purchase_invoices': purchase_invoices_collection,
            'purchase_items': purchase_items_collection,
            'purchase_orders': purchase_orders_collection,
            'purchase_receipts': purchase_receipts_collection,
            'purchase_sales': purchase_sales_collection,
            'sales': sales_collection,
            'suppliers': suppliers_collection,
            'system_settings': settings_collection,
            'tables': tables_collection,
            'trip_reports': tripreports_collection,
            'uoms': uoms_collection,
            'users': users_collection,
            'variants': variants_collection,
            'vat': vat_collection,
            'customer_groups': customer_groups_collection  # NEW: customer_groups
        }
        for collection_name, collection in collections.items():
            ws = wb.create_sheet(title=collection_name)
            data = collection.find()
            if not data:
                ws.append(['No data'])
                continue
            sample_doc = data[0]
            headers = list(sample_doc.keys())
            ws.append(headers)
            for doc in data:
                row = [str(doc.get(header, '')) if isinstance(doc.get(header), (list, dict)) else doc.get(header, '') for header in headers]
                ws.append(row)
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        filename = f'restaurant_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        logger.info(f"Exported data to Excel: {filename}")
        return Response(
            buffer.getvalue(),
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
    except Exception as e:
        logger.error(f"Error exporting to Excel: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
def manage_backup_limit():
    try:
        backup_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.endswith('.xlsx')]
        backup_files = sorted(
            backup_files,
            key=lambda x: os.path.getctime(os.path.join(app.config['UPLOAD_FOLDER'], x)),
            reverse=True
        )
        for old_file in backup_files[MAX_BACKUPS:]:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], old_file))
            logger.info(f"Deleted old backup: {old_file}")
    except Exception as e:
        logger.error(f"Error managing backup limit: {str(e)}")
def create_backup():
    try:
        if openpyxl is None:
            return False, "Excel library not available. Please install openpyxl."
        wb = openpyxl.Workbook()
        wb.remove(wb.active)
        collections = {
            'active_orders': activeorders_collection,
            'combo_offers': combo_offers_collection,
            'customers': customers_collection,
            'email_settings': email_settings_collection,
            'email_tokens': email_tokens_collection,
            'employees': employees_collection,
            'item_groups': item_groups_collection,
            'items': items_collection,
            'kitchen_saved_orders': kitchen_saved_collection,
            'kitchens': kitchens_collection,
            'order_counters': order_counters_collection,
            'picked_up_items': picked_up_collection,
            'pos_closing_entries': pos_closing_collection,
            'pos_opening_entries': opening_collection,
            'print_settings': print_settings_collection,
            'purchase_invoices': purchase_invoices_collection,
            'purchase_items': purchase_items_collection,
            'purchase_orders': purchase_orders_collection,
            'purchase_receipts': purchase_receipts_collection,
            'purchase_sales': purchase_sales_collection,
            'sales': sales_collection,
            'suppliers': suppliers_collection,
            'system_settings': settings_collection,
            'tables': tables_collection,
            'trip_reports': tripreports_collection,
            'uoms': uoms_collection,
            'users': users_collection,
            'variants': variants_collection,
            'vat': vat_collection,
            'customer_groups': customer_groups_collection  # NEW: customer_groups
        }
        for collection_name, collection in collections.items():
            ws = wb.create_sheet(title=collection_name)
            data = collection.find()
            if not data:
                ws.append(['No data'])
                continue
            sample_doc = data[0]
            headers = list(sample_doc.keys())
            ws.append(headers)
            for doc in data:
                row = [str(doc.get(header, '')) if isinstance(doc.get(header), (list, dict)) else doc.get(header, '') for header in headers]
                ws.append(row)
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'backup_restaurant_data_{timestamp}.xlsx'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        with open(file_path, 'wb') as f:
            f.write(buffer.getvalue())
        manage_backup_limit()
        settings = email_settings_collection.find_one({'_id': 'email_settings'})
        if not settings:
            logger.error("No email settings configured")
            return False, "Email settings not configured. Please configure in Email Settings."
        email_user = settings.get('email')
        email_pass = settings.get('password')
        from_email = settings.get('from_email')
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = email_user
        msg['Subject'] = f'Restaurant Data Backup - {timestamp}'
        body = f'Backup of restaurant data generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}.'
        msg.attach(MIMEText(body, 'plain'))
        with open(file_path, 'rb') as f:
            attachment = MIMEBase('application', 'octet-stream')
            attachment.set_payload(f.read())
            encoders.encode_base64(attachment)
            attachment.add_header('Content-Disposition', f'attachment; filename={filename}')
            msg.attach(attachment)
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(email_user, email_pass)
            server.send_message(msg)
        logger.info(f"Backup created and emailed: {filename}")
        return True, f"Backup created successfully: {filename}"
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {str(e)}")
        return False, "Invalid email or app password. Please check your Email Settings and ensure an App Password is used for Gmail."
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
        return False, f"SMTP error: {str(e)}"
    except Exception as e:
        logger.error(f"Error in backup: {str(e)}")
        return False, str(e)
@app.route('/api/backup-to-excel', methods=['GET'])
@db_required
def backup_to_excel():
    """Create a backup and serve it as a download."""
    try:
        success, message = create_backup()
        if not success:
            return jsonify({"error": message}), 500
        filename = message.split(': ')[1]
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        with open(file_path, 'rb') as f:
            file_data = f.read()
        return Response(
            file_data,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
    except Exception as e:
        logger.error(f"Error serving backup file: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
@app.route('/api/backup-info', methods=['GET'])
@db_required
def backup_info():
    """Retrieve information about existing backups."""
    try:
        backup_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.endswith('.xlsx')]
        backups = []
        for filename in backup_files:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            stat = os.stat(file_path)
            backups.append({
                'filename': filename,
                'date': datetime.fromtimestamp(stat.st_ctime).strftime('%Y-%m-%d %H:%M:%S'),
                'size': f"{stat.st_size / 1024:.2f} KB"
            })
        backups.sort(key=lambda x: x['date'], reverse=True)
        return jsonify(backups)
    except Exception as e:
        logger.error(f"Error retrieving backup info: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
@app.route('/api/download-backup', methods=['POST'])
@db_required
def download_backup():
    """Download a specific backup file."""
    try:
        data = request.get_json()
        filename = data.get('filename')
        if not filename:
            return jsonify({"error": "Filename not provided"}), 400
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(file_path):
            return jsonify({"error": "Backup file not found"}), 404
        with open(file_path, 'rb') as f:
            file_data = f.read()
        return Response(
            file_data,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
    except Exception as e:
        logger.error(f"Error downloading backup {filename}: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
@app.route('/api/get-backup-interval', methods=['GET'])
@db_required
def get_backup_interval():
    try:
        settings = get_system_settings()
        interval = settings.get('backup_interval_hours', 6)
        return jsonify({"interval": interval}), 200
    except Exception as e:
        logger.error(f"Error fetching backup interval: {str(e)}")
        return jsonify({"error": str(e)}), 500
@app.route('/api/set-backup-interval', methods=['POST'])
@db_required
def set_backup_interval():
    try:
        data = request.get_json()
        interval = data.get('interval')
        if interval is None or not isinstance(interval, int) or interval <= 0:
            return jsonify({"error": "Invalid interval. Must be a positive integer."}), 400
        settings = get_system_settings()
        settings['backup_interval_hours'] = interval
        save_system_settings(settings)
        # Update scheduler
        if schedule:
            schedule.clear('backup')
            schedule.every(interval).hours.do(create_backup).tag('backup')
            logger.info(f"Backup interval updated to every {interval} hours")
        return jsonify({"message": "Backup interval updated successfully"}), 200
    except Exception as e:
        logger.error(f"Error setting backup interval: {str(e)}")
        return jsonify({"error": str(e)}), 500
@app.route('/api/shutdown', methods=['POST'])
@db_required
def shutdown():
    global shutdown_flag
    logger.info("Shutdown requested")
    try:
        func = request.environ.get('werkzeug.server.shutdown')
        if func:
            func()
            logger.info("Werkzeug server shutdown initiated")
            return jsonify({"message": "Server shutting down"}), 200
        shutdown_flag = True
        logger.info("Setting shutdown flag for Waitress")
        def exit_process():
            time.sleep(1)
            logger.info("Exiting Python process")
            os._exit(0)
        threading.Thread(target=exit_process, daemon=True).start()
        return jsonify({"message": "Server shutting down"}), 200
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")
        return jsonify({"message": "Error during shutdown", "error": str(e)}), 500
# --- Data Routes (only in server mode) ---
if config.get('mode') == 'server':
    @app.route('/api/login', methods=['POST'])
    @db_required
    def login():
        try:
            data = request.get_json()
            settings = get_system_settings()
            identifier = data.get('identifier')
            password = data.get('password')
            login_type = data.get('type', 'mobile_or_username')
            if not identifier or not password:
                logger.error("Identifier or password missing in login request")
                return jsonify({"error": "Identifier and password are required"}), 400
            user = None
            if login_type == 'mobile_or_username':
                query = {"$or": [
                    {"phone_number": identifier},
                    {"username": identifier},
                    {"email": identifier}
                ]}
                user = users_collection.find_one(query)
            else:
                logger.error(f"Invalid login type: {login_type}")
                return jsonify({"error": "Invalid login type"}), 400
            if not user:
                logger.warning(f"Invalid login attempt: {identifier}")
                return jsonify({"error": "Invalid credentials"}), 401
            try:
                if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                    logger.warning(f"Invalid password for: {identifier}")
                    return jsonify({"error": "Invalid credentials"}), 401
            except ValueError as ve:
                if "Invalid salt" in str(ve):
                    logger.error(f"Invalid salt for user {user.get('email')}, rehashing")
                    new_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    users_collection.update_one({"_id": user['_id']}, {"$set": {"password": new_hash}})
                    user['password'] = new_hash
                    if not bcrypt.checkpw(password.encode('utf-8'), new_hash.encode('utf-8')):
                        return jsonify({"error": "Invalid credentials"}), 401
                else:
                    raise
            token_payload = {
                'user_id': user['_id'],
                'exp': datetime.now(timezone.utc) + timedelta(seconds=JWT_EXP_DELTA_SECONDS)
            }
            token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            user = convert_objectid_to_str(user)
            requires_opening_entry = opening_collection.find_one({
                "user_id": user['_id'],
                "date": {"$gte": datetime.now(ZoneInfo("UTC")).replace(hour=0, minute=0, second=0, microsecond=0)}
            }) is None
            response = {
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user['_id'],
                    "username": user.get('username', user.get('firstName', user.get('email', 'Unknown'))),
                    "role": user.get('role', 'bearer'),
                    "email": user.get('email', ''),
                    "phone_number": user.get('phone_number', ''),
                    "pos_profile": user.get('pos_profile', 'POS-001'),
                    "company": user.get('company', 'POS 8'),
                    "is_test": user.get('is_test', False)
                },
                "requires_opening_entry": requires_opening_entry
            }
            logger.info(f"User logged in: {identifier}")
            return jsonify(response), 200
        except KeyError as ke:
            logger.error(f"KeyError during login response building: {str(ke)}")
            return jsonify({"error": f"Internal error: Missing user field {str(ke)}"}), 500
        except Exception as e:
            logger.error(f"Login error: {e}\n{traceback.format_exc()}")
            return jsonify({"error": f"An internal server error occurred during login: {str(e)}"}), 500
    @app.route('/api/register', methods=['POST'])
    @db_required
    def register():
        try:
            data = request.get_json()
            required_fields = ['email', 'password', 'firstName', 'phone_number']
            if not all(field in data for field in required_fields):
                return jsonify({"message": "Missing required fields"}), 400
            if users_collection.find_one({"email": data['email']}):
                return jsonify({"message": "Email already registered"}), 400
            hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            new_user = {
                "email": data['email'],
                "password": hashed_password,
                "role": data.get('role', 'bearer'),
                "username": data.get('username', data['firstName']),
                "firstName": data['firstName'],
                "phone_number": data['phone_number'],
                "company": data.get('company', 'POS 8'),
                "pos_profile": data.get('pos_profile', 'POS-001'),
                "status": "Active",
                "created_at": datetime.now(ZoneInfo("UTC")).isoformat()
            }
            result = users_collection.insert_one(new_user)
            logger.info(f"User registered: {data['email']}")
            return jsonify({"message": "Registration successful", "userId": new_user['_id']}), 201
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            return jsonify({"message": f"Registration failed: {str(e)}"}), 500
    @app.route('/api/users', methods=['GET'])
    @db_required
    def get_users():
        try:
            users = users_collection.find()
            return jsonify(convert_objectid_to_str(users)), 200
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/users/<email>', methods=['DELETE'])
    @db_required
    def delete_user(email):
        try:
            if email in [u['email'] for u in TEST_USERS]:
                return jsonify({"message": "Cannot delete test users"}), 400
            result = users_collection.delete_one({"email": email})
            if result.deleted_count == 0:
                return jsonify({"message": "User not found"}), 404
            logger.info(f"User deleted: {email}")
            return jsonify({"message": "User deleted successfully"}), 200
        except Exception as e:
            logger.error(f"Error deleting user {email}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/settings', methods=['GET'])
    @db_required
    def get_settings_route():
        try:
            settings = get_system_settings()
            return jsonify(convert_objectid_to_str(settings)), 200
        except Exception as e:
            logger.error(f"Error fetching settings: {e}")
            return jsonify({"error": "An internal server error occurred."}), 500
    @app.route('/api/settings', methods=['POST'])
    @db_required
    def update_settings():
        try:
            data = request.get_json()
            save_system_settings(data)
            logger.info("System settings updated")
            return jsonify({"message": "Settings updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error updating settings: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/items', methods=['GET'])
    @db_required
    def get_items():
        try:
            items = items_collection.find()
            items_list = []
            current_time = datetime.now(ZoneInfo("UTC"))
            placeholder_url = 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=No+Image'
            for item in items:
                item = convert_objectid_to_str(item)
                is_offer_active = False
                if 'offer_start_time' in item and item['offer_start_time'] and 'offer_end_time' in item and item['offer_end_time']:
                    try:
                        offer_start_time = datetime.fromisoformat(str(item['offer_start_time']).replace('Z', '+00:00'))
                        offer_end_time = datetime.fromisoformat(str(item['offer_end_time']).replace('Z', '+00:00'))
                        if offer_start_time <= current_time <= offer_end_time:
                            is_offer_active = True
                        else:
                            items_collection.update_one(
                                {'_id': item['_id']},
                                {'$unset': {'offer_price': "", 'offer_start_time': "", 'offer_end_time': ""}}
                            )
                            item.pop('offer_price', None)
                            item.pop('offer_start_time', None)
                            item.pop('offer_end_time', None)
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Invalid offer time format for item {item['_id']}: {str(e)}")
                        items_collection.update_one(
                            {'_id': item['_id']},
                            {'$unset': {'offer_price': "", 'offer_start_time': "", 'offer_end_time': ""}}
                        )
                        item.pop('offer_price', None)
                        item.pop('offer_start_time', None)
                        item.pop('offer_end_time', None)
                if not is_offer_active:
                    item.pop('offer_price', None)
                    item.pop('offer_start_time', None)
                    item.pop('offer_end_time', None)
                if item.get('image'):
                    item['image'] = f"/api/images/{os.path.basename(item['image'])}"
                else:
                    item['image'] = placeholder_url
                for addon in item.get('addons', []):
                    if addon.get('addon_image'):
                        addon['addon_image'] = f"/api/images/{os.path.basename(addon['addon_image'])}"
                    else:
                        addon['addon_image'] = placeholder_url
                for combo in item.get("combos", []):
                    if combo.get('combo_image'):
                        combo['combo_image'] = f"/api/images/{os.path.basename(combo['combo_image'])}"
                    else:
                        combo['combo_image'] = placeholder_url
                items_list.append(item)
                logger.info(f"Fetched {len(items_list)} items")
            return jsonify(items_list), 200
        except Exception as e:
            logger.error(f"Error fetching items: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/items/<identifier>', methods=['GET'])
    @db_required
    def get_item(identifier):
        try:
            item = items_collection.find_one({'_id': identifier})
            if not item:
                item = items_collection.find_one({'item_name': identifier})
            if not item:
                logger.warning(f"Item not found: {identifier}")
                return jsonify({"error": "Item not found"}), 404
            item = convert_objectid_to_str(item)
            current_time = datetime.now(ZoneInfo("UTC"))
            placeholder_url = 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=No+Image'
            is_offer_active = False
            if 'offer_start_time' in item and item['offer_start_time'] and 'offer_end_time' in item and item['offer_end_time']:
                try:
                    offer_start_time = datetime.fromisoformat(str(item['offer_start_time']).replace('Z', '+00:00'))
                    offer_end_time = datetime.fromisoformat(str(item['offer_end_time']).replace('Z', '+00:00'))
                    if offer_start_time <= current_time <= offer_end_time:
                        is_offer_active = True
                except (ValueError, TypeError):
                    items_collection.update_one(
                        {'_id': item['_id']},
                        {'$unset': {'offer_price': "", 'offer_start_time': "", 'offer_end_time': ""}}
                    )
                    item.pop('offer_price', None)
                    item.pop('offer_start_time', None)
                    item.pop('offer_end_time', None)
            if not is_offer_active:
                item.pop('offer_price', None)
                item.pop('offer_start_time', None)
                item.pop('offer_end_time', None)
            if item.get('image'):
                item['image'] = f"/api/images/{os.path.basename(item['image'])}"
            else:
                item['image'] = placeholder_url
            for addon in item.get('addons', []):
                if addon.get('addon_image'):
                    addon['addon_image'] = f"/api/images/{os.path.basename(addon['addon_image'])}"
                else:
                    addon['addon_image'] = placeholder_url
            for combo in item.get("combos", []):
                if combo.get('combo_image'):
                    combo['combo_image'] = f"/api/images/{os.path.basename(combo['combo_image'])}"
                else:
                    combo['combo_image'] = placeholder_url
            logger.info(f"Fetched item: {identifier}")
            return jsonify(item), 200
        except Exception as e:
            logger.error(f"Error fetching item {identifier}: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/items', methods=['POST'])
    @db_required
    def create_item():
        try:
            data = request.json
            if not data:
                logger.error("No data provided for item creation")
                return jsonify({"error": "No data provided"}), 400
            required_fields = ['item_name', 'item_code', 'item_group', 'price_list_rate']
            for field in required_fields:
                if field not in data or not data[field]:
                    logger.error(f"Missing or empty required field: {field}")
                    return jsonify({"error": f"Missing or empty required field: {field}"}), 400
            if 'offer_start_time' in data and data['offer_start_time'] and 'offer_end_time' in data and data['offer_end_time']:
                try:
                    offer_start_time = datetime.fromisoformat(str(data['offer_start_time']).replace('Z', '+00:00'))
                    offer_end_time = datetime.fromisoformat(str(data['offer_end_time']).replace('Z', '+00:00'))
                    if offer_start_time >= offer_end_time:
                        logger.error("offer_start_time must be before offer_end_time")
                        return jsonify({"error": "Offer start time must be before offer end time"}), 400
                except (ValueError, TypeError) as e:
                    logger.error(f"Invalid offer time format: {str(e)}")
                    return jsonify({"error": f"Invalid offer time format: {str(e)}"}), 400
            data = sanitize_image_fields(data)
            data.setdefault('custom_addon_applicable', False)
            data.setdefault('custom_combo_applicable', False)
            data.setdefault('custom_total_calories', 0)
            data.setdefault('custom_total_protein', 0)
            data.setdefault('kitchen', "")
            data.setdefault('has_variant_pricing', False)
            data.setdefault('variant_prices', {"small_price": 0, "medium_price": 0, "large_price": 0})
            data.setdefault('variant_quantities', {"small_quantity": 0, "medium_quantity": 0, "large_quantity": 0})
            data.setdefault('sold_quantities', {"small_sold": 0, "medium_sold": 0, "large_sold": 0})
            data.setdefault('ice_preference', "without_ice")
            data.setdefault('ice_price', 0)
            data.setdefault('addons', [])
            data.setdefault('combos', [])
            data.setdefault('ingredients', [])
            data.setdefault('variants', [])
            data['created_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
            item_id = items_collection.insert_one(data).inserted_id
            logger.info(f"Item created with ID: {item_id}")
            return jsonify({'message': 'Item created successfully!', 'id': item_id}), 201
        except Exception as e:
            logger.error(f"Error creating item: {str(e)}")
            return jsonify({'error': str(e)}), 500
    @app.route('/api/items/<item_id>', methods=['PUT'])
    @db_required
    def update_item(item_id):
        try:
            data = request.json
            if not data:
                logger.error("No data provided for item update")
                return jsonify({"error": "No data provided"}), 400
            if '_id' in data:
                del data['_id']
            if 'offer_start_time' in data and data['offer_start_time'] and 'offer_end_time' in data and data['offer_end_time']:
                try:
                    offer_start_time = datetime.fromisoformat(str(data['offer_start_time']).replace('Z', '+00:00'))
                    offer_end_time = datetime.fromisoformat(str(data['offer_end_time']).replace('Z', '+00:00'))
                    if offer_start_time >= offer_end_time:
                        logger.error("offer_start_time must be before offer_end_time")
                        return jsonify({"error": "Offer start time must be before offer end time"}), 400
                except (ValueError, TypeError) as e:
                    logger.error(f"Invalid offer time format: {str(e)}")
                    return jsonify({"error": f"Invalid offer time format: {str(e)}"}), 400
            data = sanitize_image_fields(data)
            data['modified_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
            result = items_collection.update_one({'_id': item_id}, {'$set': data})
            if result.matched_count == 0:
                logger.warning(f"Item not found for update: {item_id}")
                return jsonify({"error": "Item not found"}), 404
            logger.info(f"Item updated: {item_id}")
            return jsonify({"message": "Item updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error updating item {item_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/items/<item_id>', methods=['PATCH'])
    @db_required
    def patch_item(item_id):
        try:
            data = request.json
            if not data:
                logger.error("No data provided for item patch")
                return jsonify({"error": "No data provided"}), 400
            if '_id' in data:
                del data['_id']
            data = sanitize_image_fields(data)
            data['modified_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
            result = items_collection.update_one({'_id': item_id}, {'$set': data})
            if result.matched_count == 0:
                logger.warning(f"Item not found for patch: {item_id}")
                return jsonify({"error": "Item not found"}), 404
            logger.info(f"Item patched: {item_id}")
            return jsonify({"message": "Item updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error patching item {item_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/items/<item_id>', methods=['DELETE'])
    @db_required
    def delete_item(item_id):
        try:
            result = items_collection.delete_one({'_id': item_id})
            if result.deleted_count == 0:
                logger.warning(f"Item not found for deletion: {item_id}")
                return jsonify({"error": "Item not found"}), 404
            logger.info(f"Item deleted: {item_id}")
            return jsonify({"message": "Item deleted successfully"}), 200
        except Exception as e:
            logger.error(f"Error deleting item {item_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/items/<item_id>/offer', methods=['PUT'])
    @db_required
    def update_item_offer(item_id):
        try:
            offer_data = request.json
            if 'offer_price' not in offer_data or 'offer_start_time' not in offer_data or 'offer_end_time' in offer_data:
                return jsonify({"error": "Offer price, start time, and end time are required"}), 400
            try:
                offer_start_time = datetime.fromisoformat(str(offer_data['offer_start_time']).replace('Z', '+00:00'))
                offer_end_time = datetime.fromisoformat(str(offer_data['offer_end_time']).replace('Z', '+00:00'))
                if offer_start_time >= offer_end_time:
                    logger.error("offer_start_time must be before offer_end_time")
                    return jsonify({"error": "Offer start time must be before offer end time"}), 400
            except (ValueError, TypeError) as e:
                logger.error(f"Invalid offer time format: {str(e)}")
                return jsonify({"error": f"Invalid offer time format: {str(e)}"}), 400
            offer_data['modified_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
            result = items_collection.update_one({'_id': item_id}, {'$set': offer_data})
            if result.matched_count == 0:
                logger.warning(f"Item not found for offer update: {item_id}")
                return jsonify({"error": "Item not found"}), 404
            logger.info(f"Offer updated for item: {item_id}")
            return jsonify({"message": "Offer updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error updating offer for item {item_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/customers', methods=['GET'])
    @db_required
    def get_all_customers():
        try:
            customers = customers_collection.find()
            customers = convert_objectid_to_str(customers)
            logger.info(f"Fetched {len(customers)} customers")
            return jsonify(customers), 200
        except Exception as e:
            logger.error(f"Error fetching customers: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/customers/<customer_id>', methods=['GET', 'PUT', 'DELETE'])
    @db_required
    def customer_operations(customer_id):
        try:
            if not customer_id or customer_id == "undefined":
                logger.error("Invalid customer_id: 'undefined' or empty")
                return jsonify({"error": "Invalid customer ID"}), 400
            if request.method == 'GET':
                customer = customers_collection.find_one({'_id': customer_id})
                if not customer:
                    logger.warning(f"Customer not found: {customer_id}")
                    return jsonify({"error": "Customer not found"}), 404
                customer = convert_objectid_to_str(customer)
                logger.info(f"Fetched customer: {customer_id}")
                return jsonify(customer), 200
            elif request.method == 'PUT':
                customer_data = request.get_json()
                if not customer_data:
                    logger.error("No data provided for customer update")
                    return jsonify({"error": "No data provided"}), 400
                result = customers_collection.update_one(
                    {'_id': customer_id},
                    {'$set': {
                        'customer_name': customer_data.get('customer_name', ''),
                        'phone_number': customer_data.get('phone_number', ''),
                        'whatsapp_number': customer_data.get('whatsapp_number', ''),
                        'email': customer_data.get('email', ''),
                        'building_name': customer_data.get('building_name', ''),
                        'flat_villa_no': customer_data.get('flat_villa_no', ''),
                        'location': customer_data.get('location', ''),
                        'customer_group': customer_data.get('customer_group', ''),  # NEW: Update customer_group
                        'modified_at': datetime.now(ZoneInfo("UTC")).isoformat()
                    }}
                )
                if result.matched_count == 0:
                    logger.warning(f"Customer not found for update: {customer_id}")
                    return jsonify({"error": "Customer not found"}), 404
                logger.info(f"Customer updated: {customer_id}")
                return jsonify({"message": "Customer updated successfully"}), 200
            elif request.method == 'DELETE':
                result = customers_collection.delete_one({'_id': customer_id})
                if result.deleted_count == 0:
                    logger.warning(f"Customer not found for deletion: {customer_id}")
                    return jsonify({"error": "Customer not found"}), 404
                logger.info(f"Customer deleted: {customer_id}")
                return jsonify({"message": "Customer deleted successfully"}), 200
        except Exception as e:
            logger.error(f"Error in customer operations for {customer_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/customers', methods=['POST'])
    @db_required
    def create_customer():
        try:
            customer_data = request.get_json()
            if not customer_data or 'customer_name' not in customer_data or 'phone_number' not in customer_data:
                logger.error("Invalid customer data provided")
                return jsonify({"error": "Customer name and phone number are required"}), 400
            existing_customer = customers_collection.find_one({'phone_number': customer_data['phone_number']})
            if existing_customer:
                logger.warning(f"Duplicate phone number: {customer_data['phone_number']}")
                return jsonify({"error": "Phone number already exists", "customer_name": existing_customer['customer_name']}), 409
            customer_data['created_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
            customer_data['modified_at'] = customer_data['created_at']
            result = customers_collection.insert_one(customer_data)
            new_customer_id = result.inserted_id
            logger.info(f"Customer created: {new_customer_id}")
            return jsonify({"id": new_customer_id, "message": "Customer created successfully"}), 201
        except Exception as e:
            logger.error(f"Error creating customer: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/customer-groups', methods=['GET'])
    @db_required
    def get_customer_groups():
        try:
            groups = customer_groups_collection.find()
            groups = convert_objectid_to_str(groups)
            logger.info(f"Fetched {len(groups)} customer groups")
            return jsonify(groups), 200
        except Exception as e:
            logger.error(f"Error fetching customer groups: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/customer-groups', methods=['POST'])
    @db_required
    def create_customer_group():
        try:
            data = request.get_json()
            if not data or 'group_name' not in data:
                logger.error("Missing group_name in request")
                return jsonify({"error": "Group name is required"}), 400
            group_name = data['group_name']
            if customer_groups_collection.find_one({"group_name": group_name}):
                logger.warning(f"Customer group already exists: {group_name}")
                return jsonify({"error": "Customer group name already exists"}), 400
            new_group = {
                "group_name": group_name,
                "created_at": datetime.now(ZoneInfo("UTC")).isoformat()
            }
            result = customer_groups_collection.insert_one(new_group)
            logger.info(f"Customer group created: {group_name}")
            return jsonify({"message": "Customer group created successfully", "id": result.inserted_id}), 201
        except Exception as e:
            logger.error(f"Error creating customer group: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/customer-groups/<group_id>', methods=['PUT'])
    @db_required
    def update_customer_group(group_id):
        try:
            data = request.get_json()
            if not data or 'group_name' not in data:
                logger.error("Missing group_name in request")
                return jsonify({"error": "Group name is required"}), 400
            result = customer_groups_collection.update_one(
                {'_id': group_id},
                {'$set': {'group_name': data['group_name'], 'modified_at': datetime.now(ZoneInfo("UTC")).isoformat()}}
            )
            if result.matched_count == 0:
                logger.warning(f"Customer group not found for update: {group_id}")
                return jsonify({"error": "Customer group not found"}), 404
            logger.info(f"Customer group updated: {group_id}")
            return jsonify({"message": "Customer group updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error updating customer group {group_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/customer-groups/<group_id>', methods=['DELETE'])
    @db_required
    def delete_customer_group(group_id):
        try:
            result = customer_groups_collection.delete_one({'_id': group_id})
            if result.deleted_count == 0:
                logger.warning(f"Customer group not found for deletion: {group_id}")
                return jsonify({"error": "Customer group not found"}), 404
            logger.info(f"Customer group deleted: {group_id}")
            return jsonify({"message": "Customer group deleted successfully"}), 200
        except Exception as e:
            logger.error(f"Error deleting customer group {group_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/sales', methods=['POST'])
    @db_required
    def create_sales_invoice():
        try:
            sales_data = request.json
            required_fields = ['customer', 'items', 'total', 'userId']
            missing_fields = [field for field in required_fields if field not in sales_data or sales_data[field] is None]
            if missing_fields:
                error_msg = f"Missing required fields: {', '.join(missing_fields)}"
                logger.error(error_msg)
                return jsonify({"error": error_msg}), 400
            user = users_collection.find_one({"email": sales_data['userId']})
            if not user:
                logger.error(f"Invalid userId: {sales_data['userId']}")
                return jsonify({"error": "Invalid userId"}), 400
            sales_data['date'] = sales_data.get('date', datetime.now().strftime("%Y-%m-%d"))
            sales_data['time'] = sales_data.get('time', datetime.now().strftime("%H:%M:%S"))
            net_total = float(sales_data['total'])
            vat_settings = vat_collection.find_one({"_id": "vat_settings"})
            vat_rate = vat_settings.get("vat", 10) / 100 if vat_settings else 0
            vat_amount = float(sales_data.get('vat_amount', net_total * vat_rate))
            grand_total = float(sales_data.get('grand_total', net_total + vat_amount))
            sales_data['vat_amount'] = round(vat_amount, 2)
            sales_data['grand_total'] = round(grand_total, 2)
            sales_data['invoice_no'] = sales_data.get('invoice_no', f"INV-{int(datetime.now().timestamp())}")
            sales_data['status'] = sales_data.get('status', 'Draft')
            processed_items = []
            for item in sales_data.get('items', []):
                if not all(key in item for key in ['item_name', 'basePrice', 'quantity']):
                    logger.error("Invalid item structure in sales invoice")
                    return jsonify({"error": "Each item must include item_name, basePrice, and quantity"}), 400
                processed_addons = []
                for addon in item.get('addons', []):
                    if not all(key in addon for key in ['name1', 'addon_price', 'addon_quantity']):
                        logger.error("Invalid addon structure in sales invoice")
                        return jsonify({"error": "Each addon must include name1, addon_price, and addon_quantity"}), 400
                    processed_addons.append({
                        "addon_name": addon['name1'],
                        "addon_price": float(addon['addon_price']),
                        "addon_quantity": int(addon['addon_quantity']),
                        "addon_image": addon.get('addon_image', ''),
                        "size": addon.get('size', 'M'),
                        "kitchen": addon.get('kitchen', 'Main Kitchen'),
                    })
                processed_combos = []
                for combo in item.get('selectedCombos', []):
                    if not all(key in combo for key in ['name1', 'combo_price']):
                        logger.error("Invalid combo structure in sales invoice")
                        return jsonify({"error": "Each combo must include name1 and combo_price"}), 400
                    processed_combos.append({
                        "name1": combo['name1'],
                        "combo_price": float(combo['combo_price']),
                        "combo_quantity": int(combo.get('combo_quantity', 1)),
                        "combo_image": combo.get('combo_image', ''),
                        "size": combo.get('size', 'M'),
                        "spicy": combo.get('spicy', False),
                        "kitchen": combo.get('kitchen', 'Main Kitchen'),
                    })
                processed_items.append({
                    "item_name": item['item_name'],
                    "basePrice": float(item['basePrice']),
                    "quantity": int(item['quantity']),
                    "amount": float(item.get('amount', item['basePrice'])),
                    "icePreference": item.get('icePreference', 'without_ice'),
                    "isSpicy": item.get('isSpicy', False),
                    "kitchen": item.get('kitchen', 'Main Kitchen'),
                    "selectedSize": item.get('selectedSize', 'M'),
                    "ingredients": item.get('ingredients', []),
                    "addons": processed_addons,
                    "selectedCombos": processed_combos,
                })
            sales_data['items'] = processed_items
            sales_data['created_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
            sales_id = sales_collection.insert_one(sales_data).inserted_id
            logger.info(f"Sale saved successfully: {sales_data['invoice_no']}")
            return jsonify({
                "id": sales_id,
                "invoice_no": sales_data['invoice_no'],
                "net_total": sales_data['total'],
                "vat_amount": sales_data['vat_amount'],
                "grand_total": sales_data['grand_total'],
                "userId": sales_data['userId']
            }), 201
        except Exception as e:
            logger.error(f"Error creating sales invoice: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/sales', methods=['GET'])
    @db_required
    def get_all_sales():
        try:
            sales = sales_collection.find()
            sales = convert_objectid_to_str(sales)
            sales = [sale for sale in sales if sale.get('status') != 'Cancelled']
            logger.info(f"Fetched {len(sales)} sales invoices")
            return jsonify(sales), 200
        except Exception as e:
            logger.error(f"Error fetching sales: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/sales/<invoice_no>', methods=['GET'])
    @db_required
    def get_sale_by_invoice_no(invoice_no):
        try:
            sale = sales_collection.find_one({"invoice_no": invoice_no.strip()})
            if not sale:
                logger.warning(f"Sale not found: {invoice_no}")
                return jsonify({"error": "Invoice not found"}), 404
            sale = convert_objectid_to_str(sale)
            logger.info(f"Fetched sale: {invoice_no}")
            return jsonify(sale), 200
        except Exception as e:
            logger.error(f"Error fetching sale {invoice_no}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/sales/<invoice_no>/status', methods=['PUT'])
    @db_required
    def update_sale_status(invoice_no):
        try:
            data = request.get_json()
            status = data.get('status')
            if not status:
                return jsonify({"error": "Status is required"}), 400
            result = sales_collection.update_one(
                {'invoice_no': invoice_no.strip()},
                {'$set': {'status': status, 'modified_at': datetime.now(ZoneInfo("UTC")).isoformat()}}
            )
            if result.matched_count == 0:
                logger.warning(f"Sale not found for status update: {invoice_no}")
                return jsonify({"error": "Invoice not found"}), 404
            logger.info(f"Sale status updated: {invoice_no} to {status}")
            return jsonify({"message": "Sale status updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error updating sale status {invoice_no}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/tables', methods=['GET'])
    @db_required
    def get_tables():
        try:
            tables = tables_collection.find()
            tables = convert_objectid_to_str(tables)
            logger.info(f"Fetched {len(tables)} tables")
            return jsonify({"message": tables}), 200
        except Exception as e:
            logger.error(f"Error fetching tables: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/tables', methods=['POST'])
    @db_required
    def add_table():
        try:
            data = request.get_json()
            table_number = data.get("table_number")
            floor = data.get("floor")
            if floor:
                floor = floor.strip()
            number_of_chairs = data.get("number_of_chairs")
            type_ = data.get("type", "Round")
            chairs = data.get("chairs", [])
            x = data.get("x", 0)
            y = data.get("y", 0)
            if not table_number or not floor or not number_of_chairs:
                logger.error("Missing table_number, floor, or number_of_chairs")
                return jsonify({"error": "Table number, floor, and number of chairs are required"}), 400
            # Check for duplicate table_number on the same floor only
            if tables_collection.find_one({"table_number": table_number, "floor": floor}):
                logger.warning(f"Table number {table_number} already exists on floor {floor}")
                return jsonify({"error": f"Table number {table_number} already exists on floor {floor}"}), 400
            new_table = {
                "table_number": table_number,
                "floor": floor,
                "number_of_chairs": int(number_of_chairs),
                "type": type_,
                "chairs": chairs,
                "x": x,
                "y": y,
                "created_at": datetime.now(ZoneInfo("UTC")).isoformat()
            }
            tables_collection.insert_one(new_table)
            logger.info(f"Table added: {table_number} on floor {floor}")
            return jsonify({"message": "Table added successfully"}), 201
        except Exception as e:
            logger.error(f"Error adding table: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/tables/<table_number>', methods=['PUT'])
    @db_required
    def update_table(table_number):
        try:
            data = request.get_json()
            floor = data.get("floor")
            if not floor:
                logger.error("Floor is required for table update")
                return jsonify({"error": "Floor is required"}), 400
            floor = floor.strip()
            update_data = {}
            if "number_of_chairs" in data:
                update_data["number_of_chairs"] = int(data["number_of_chairs"])
            if "type" in data:
                update_data["type"] = data["type"]
            if "chairs" in data:
                update_data["chairs"] = data["chairs"]
            if "x" in data:
                update_data["x"] = data["x"]
            if "y" in data:
                update_data["y"] = data["y"]
            if "floor" in data:
                update_data["floor"] = data["floor"].strip()
            if not update_data:
                return jsonify({"error": "No data provided to update"}), 400
            update_data["modified_at"] = datetime.now(ZoneInfo("UTC")).isoformat()
            # Match by both table_number and floor to ensure floor-specific update
            result = tables_collection.update_one(
                {"table_number": table_number, "floor": floor},
                {"$set": update_data}
            )
            if result.matched_count == 0:
                logger.warning(f"Table not found for update: {table_number} on floor {floor}")
                return jsonify({"error": "Table not found"}), 404
            logger.info(f"Table updated: {table_number} on floor {floor}")
            return jsonify({"message": "Table updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error updating table {table_number}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/tables/<table_number>', methods=['DELETE'])
    @db_required
    def delete_table(table_number):
        try:
            data = request.get_json() or {}
            floor = data.get("floor")
            if not floor:
                logger.error("Floor is required for table deletion")
                return jsonify({"error": "Floor is required"}), 400
            floor = floor.strip()
            # Delete by both table_number and floor to ensure floor-specific deletion
            result = tables_collection.delete_one({"table_number": table_number, "floor": floor})
            if result.deleted_count == 0:
                logger.warning(f"Table not found: {table_number} on floor {floor}")
                return jsonify({"error": "Table not found"}), 404
            logger.info(f"Table deleted: {table_number} on floor {floor}")
            return jsonify({"message": "Table deleted successfully"}), 200
        except Exception as e:
            logger.error(f"Error deleting table {table_number}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/create_opening_entry', methods=['POST'])
    @db_required
    def create_opening_entry():
        try:
            data = request.get_json()
            if not data:
                return jsonify({"message": "No data provided", "status": "error"}), 400
            required_fields = ['period_start_date', 'posting_date', 'company', 'user', 'balance_details']
            missing_fields = [field for field in required_fields if field not in data or not data[field]]
            if missing_fields:
                return jsonify({"message": f"Missing fields: {', '.join(missing_fields)}", "status": "error"}), 400
            balance_details = data['balance_details']
            if not isinstance(balance_details, list):
                return jsonify({"message": "balance_details must be a list", "status": "error"}), 400
            for detail in balance_details:
                if not all(key in detail for key in ['mode_of_payment', 'opening_amount']):
                    return jsonify({"message": "Each balance detail must have mode_of_payment and opening_amount", "status": "error"}), 400
                detail['opening_amount'] = float(detail['opening_amount'])
            data['creation'] = datetime.now(ZoneInfo("UTC")).isoformat()
            data['modified'] = data['creation']
            data['name'] = f"OPEN-{int(datetime.now().timestamp())}"
            data['status'] = data.get('status', 'Draft')
            data['docstatus'] = data.get('docstatus', 0)
            data['pos_profile'] = data.get('pos_profile', 'POS-001')
            result = opening_collection.insert_one(data)
            username = data['user']
            user = users_collection.find_one({"firstName": username})
            if user:
                users_collection.update_one(
                    {"_id": user['_id']},
                    {"$set": {"last_opening_entry_time": datetime.now(ZoneInfo("UTC")).isoformat()}}
                )
                logger.info(f"Updated last_opening_entry_time for user: {username}")
            logger.info(f"POS opening entry created: {data['name']}")
            return jsonify({"message": {"name": data['name'], "status": "success"}}), 201
        except Exception as e:
            logger.error(f"Error in create_opening_entry: {str(e)}")
            return jsonify({"message": f"Server error: {str(e)}", "status": "error"}), 500
    @app.route('/api/get_pos_opening_entries', methods=['POST'])
    @db_required
    def get_pos_opening_entries():
        try:
            data = request.get_json()
            if not data or 'pos_profile' not in data:
                return jsonify({"message": "POS profile is required", "status": "error"}), 400
            pos_profile = data['pos_profile']
            entries = opening_collection.find({"pos_profile": pos_profile})
            entries = convert_objectid_to_str(entries)
            logger.info(f"Fetched {len(entries)} POS opening entries for profile: {pos_profile}")
            return jsonify({"message": entries, "status": "success"}), 200
        except Exception as e:
            logger.error(f"Error in get_pos_opening_entries: {str(e)}")
            return jsonify({"message": f"Server error: {str(e)}", "status": "error"}), 500
    @app.route('/api/get_pos_invoices', methods=['POST'])
    @db_required
    def get_pos_invoices():
        try:
            data = request.get_json()
            pos_opening_entry = data.get('pos_opening_entry')
            if not pos_opening_entry:
                return jsonify({"message": "POS opening entry is required", "status": "error"}), 400
            opening_entry = opening_collection.find_one({"name": pos_opening_entry})
            if not opening_entry:
                return jsonify({"message": "Opening entry not found", "status": "error"}), 404
            period_start = opening_entry['period_start_date']
            invoices = sales_collection.find({"date": {"$gte": period_start}})
            invoices = convert_objectid_to_str(invoices)
            total = sum(float(inv['grand_total']) for inv in invoices)
            net_total = sum(float(inv['total']) for inv in invoices)
            total_qty = sum(sum(item['quantity'] for item in inv['items']) for inv in invoices)
            vat_settings = vat_collection.find_one({"_id": "vat_settings"})
            vat_percentage = vat_settings.get("vat", 10) if vat_settings else 10
            taxes = [{"account_head": "VAT", "rate": vat_percentage, "amount": total - net_total}]
            response = {
                "invoices": [{"pos_invoice": inv['invoice_no'], "grand_total": inv['grand_total'], "posting_date": inv['date'], "customer": inv['customer']} for inv in invoices],
                "taxes": taxes,
                "grand_total": total,
                "net_total": net_total,
                "total_quantity": total_qty,
                "status": "success"
            }
            logger.info(f"Fetched POS invoices for opening entry: {pos_opening_entry}")
            return jsonify({"message": response}), 200
        except Exception as e:
            logger.error(f"Error in get_pos_invoices: {str(e)}")
            return jsonify({"message": f"Error: {str(e)}", "status": "error"}), 500
    @app.route('/api/create_closing_entry', methods=['POST'])
    @db_required
    def create_closing_entry():
        try:
            data = request.get_json()
            required_fields = ['pos_opening_entry', 'posting_date', 'period_end_date', 'pos_transactions', 'payment_reconciliation', 'taxes', 'grand_total', 'net_total', 'total_quantity']
            if not data or not all(field in data for field in required_fields):
                return jsonify({"message": f"Missing fields: {', '.join([f for f in required_fields if f not in data])}", "status": "error"}), 400
            opening_entry = opening_collection.find_one({"name": data['pos_opening_entry']})
            if not opening_entry:
                return jsonify({"message": "Opening entry not found", "status": "error"}), 404
            data['creation'] = datetime.now(ZoneInfo("UTC")).isoformat()
            data['modified'] = data['creation']
            data['name'] = f"CLOSE-{int(datetime.now().timestamp())}"
            data['status'] = 'Draft'
            data['docstatus'] = 0
            result = pos_closing_collection.insert_one(data)
            logger.info(f"POS closing entry created: {data['name']}")
            return jsonify({"message": {"name": data['name'], "status": "success", "message": "Closing Entry created"}}), 201
        except Exception as e:
            logger.error(f"Error in create_closing_entry: {str(e)}")
            return jsonify({"message": f"Error: {str(e)}", "status": "error"}), 500
    @app.route('/api/kitchens', methods=['GET'])
    @db_required
    def get_kitchens():
        try:
            kitchens = kitchens_collection.find()
            kitchens = convert_objectid_to_str(kitchens)
            logger.info(f"Fetched {len(kitchens)} kitchens")
            return jsonify(kitchens), 200
        except Exception as e:
            logger.error(f"Error fetching kitchens: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/kitchens', methods=['POST'])
    @db_required
    def create_kitchen():
        try:
            data = request.get_json()
            if not data or 'kitchen_name' not in data:
                logger.error("Missing kitchen_name in request")
                return jsonify({"error": "Kitchen name is required"}), 400
            kitchen_name = data['kitchen_name']
            if kitchens_collection.find_one({"kitchen_name": kitchen_name}):
                logger.warning(f"Kitchen already exists: {kitchen_name}")
                return jsonify({"error": "Kitchen name already exists"}), 400
            new_kitchen = {
                "kitchen_name": kitchen_name,
                "created_at": datetime.now(ZoneInfo("UTC")).isoformat()
            }
            result = kitchens_collection.insert_one(new_kitchen)
            logger.info(f"Kitchen created: {kitchen_name}")
            return jsonify({"message": "Kitchen created successfully", "id": result.inserted_id}), 201
        except Exception as e:
            logger.error(f"Error creating kitchen: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/kitchens/<kitchen_id>', methods=['PUT'])
    @db_required
    def update_kitchen(kitchen_id):
        try:
            data = request.get_json()
            if not data or 'kitchen_name' not in data:
                logger.error("Missing kitchen_name in request")
                return jsonify({"error": "Kitchen name is required"}), 400
            result = kitchens_collection.update_one(
                {'_id': kitchen_id},
                {'$set': {'kitchen_name': data['kitchen_name'], 'modified_at': datetime.now(ZoneInfo("UTC")).isoformat()}}
            )
            if result.matched_count == 0:
                logger.warning(f"Kitchen not found for update: {kitchen_id}")
                return jsonify({"error": "Kitchen not found"}), 404
            logger.info(f"Kitchen updated: {kitchen_id}")
            return jsonify({"message": "Kitchen updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error updating kitchen {kitchen_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/kitchens/<kitchen_id>', methods=['DELETE'])
    @db_required
    def delete_kitchen(kitchen_id):
        try:
            result = kitchens_collection.delete_one({'_id': kitchen_id})
            if result.deleted_count == 0:
                logger.warning(f"Kitchen not found for deletion: {kitchen_id}")
                return jsonify({"error": "Kitchen not found"}), 404
            logger.info(f"Kitchen deleted: {kitchen_id}")
            return jsonify({"message": "Kitchen deleted successfully"}), 200
        except Exception as e:
            logger.error(f"Error deleting kitchen {kitchen_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/item-groups', methods=['GET'])
    @db_required
    def get_item_groups():
        try:
            item_groups = item_groups_collection.find()
            item_groups = convert_objectid_to_str(item_groups)
            logger.info(f"Fetched {len(item_groups)} item groups")
            return jsonify(item_groups), 200
        except Exception as e:
            logger.error(f"Error fetching item groups: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/item-groups', methods=['POST'])
    @db_required
    def create_item_group():
        try:
            data = request.get_json()
            if not data or 'group_name' not in data:
                logger.error("Missing group_name in request")
                return jsonify({"error": "Group name is required"}), 400
            group_name = data['group_name']
            if item_groups_collection.find_one({"group_name": group_name}):
                logger.warning(f"Item group already exists: {group_name}")
                return jsonify({"error": "Item group name already exists"}), 400
            new_group = {
                "group_name": group_name,
                "created_at": datetime.now(ZoneInfo("UTC")).isoformat()
            }
            result = item_groups_collection.insert_one(new_group)
            logger.info(f"Item group created: {group_name}")
            return jsonify({"message": "Item group created successfully", "id": result.inserted_id}), 201
        except Exception as e:
            logger.error(f"Error creating item group: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/item-groups/<group_id>', methods=['PUT'])
    @db_required
    def update_item_group(group_id):
        try:
            data = request.get_json()
            if not data or 'group_name' not in data:
                logger.error("Missing group_name in request")
                return jsonify({"error": "Group name is required"}), 400
            result = item_groups_collection.update_one(
                {'_id': group_id},
                {'$set': {'group_name': data['group_name'], 'modified_at': datetime.now(ZoneInfo("UTC")).isoformat()}}
            )
            if result.matched_count == 0:
                logger.warning(f"Item group not found for update: {group_id}")
                return jsonify({"error": "Item group not found"}), 404
            logger.info(f"Item group updated: {group_id}")
            return jsonify({"message": "Item group updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error updating item group {group_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/item-groups/<group_id>', methods=['DELETE'])
    @db_required
    def delete_item_group(group_id):
        try:
            result = item_groups_collection.delete_one({'_id': group_id})
            if result.deleted_count == 0:
                logger.warning(f"Item group not found for deletion: {group_id}")
                return jsonify({"error": "Item group not found"}), 404
            logger.info(f"Item group deleted: {group_id}")
            return jsonify({"message": "Item group deleted successfully"}), 200
        except Exception as e:
            logger.error(f"Error deleting item group {group_id}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/items/nutrition', methods=['POST', 'OPTIONS'])
    @db_required
    def save_item_nutrition():
        if request.method == 'OPTIONS':
            response = jsonify({"success": True})
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            return response, 200
        try:
            data = request.get_json()
            if not data:
                logger.error("No data provided for saving ingredients")
                return jsonify({"error": "No data provided"}), 400
            required_fields = ['item_name', 'type', 'instances', 'ingredients']
            for field in required_fields:
                if field not in data or data[field] is None:
                    logger.error(f"Missing or null required field: {field}")
                    return jsonify({"error": f"Missing or null required field: {field}"}), 400
            item_name = data['item_name']
            item_type = data['type']
            instances = data['instances']
            ingredients = data['ingredients']
            if item_type not in ['item', 'addon', 'combo']:
                logger.error(f"Invalid type: {item_type}")
                return jsonify({"error": "Invalid type, must be 'item', 'addon', or 'combo'"}), 400
            if not isinstance(ingredients, list):
                logger.error("Ingredients must be a list of objects")
                return jsonify({"error": "Ingredients must be a list of objects"}), 400
            for ingredient in ingredients:
                if not isinstance(ingredient, dict) or not all(key in ingredient for key in ['name', 'small', 'medium', 'large', 'weight', 'nutrition']):
                    logger.error("Each ingredient must be an object with required fields")
                    return jsonify({"error": "Each ingredient must be an object with required fields"}), 400
            filtered_ingredients = [ing for ing in ingredients if ing['name'].strip()]
            updated_count = 0
            for instance in instances:
                item_id = instance['item_id']
                index = instance.get('index')
                item = items_collection.find_one({'_id': item_id})
                if not item:
                    logger.warning(f"Item not found: {item_id}")
                    continue
                update_data = {'$set': {'modified_at': datetime.now(ZoneInfo("UTC")).isoformat()}}
                if item_type == 'item':
                    update_data['$set']['ingredients'] = filtered_ingredients
                elif item_type == 'addon':
                    if index is None or not isinstance(index, int):
                        logger.error(f"Index is required for addons in item_id: {item_id}")
                        continue
                    update_data['$set'][f'addons.{index}.ingredients'] = filtered_ingredients
                elif item_type == 'combo':
                    if index is None or not isinstance(index, int):
                        logger.error(f"Index is required for combos in item_id: {item_id}")
                        continue
                    update_data['$set'][f'combos.{index}.ingredients'] = filtered_ingredients
                result = items_collection.update_one({'_id': item_id}, update_data)
                if result.matched_count > 0:
                    updated_count += 1
            if updated_count == 0:
                logger.error(f"No items updated for {item_type}: {item_name}")
                return jsonify({"error": "No items updated, please check instance data"}), 400
            logger.info(f"Ingredients updated for {item_type}: {item_name} across {updated_count} instances")
            return jsonify({"message": "Ingredients saved successfully"}), 200
        except Exception as e:
            logger.error(f"Error saving ingredients for {item_name}: {str(e)}")
            return jsonify({"error": f"Server error: {str(e)}"}), 500
    @app.route('/api/items/nutrition/<item_name>', methods=['GET', 'DELETE', 'OPTIONS'])
    @db_required
    def handle_item_nutrition(item_name):
        if request.method == 'OPTIONS':
            response = jsonify({"success": True})
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Instances'
            return response, 200
        try:
            item_type = request.args.get('type')
            item_id = request.args.get('item_id')
            index = request.args.get('index')
            if request.method == 'GET':
                if not item_type or not item_id:
                    logger.error("Type and item_id are required")
                    return jsonify({"error": "Type and item_id are required"}), 400
                if item_type not in ['item', 'addon', 'combo']:
                    logger.error(f"Invalid type: {item_type}")
                    return jsonify({"error": "Invalid type, must be 'item', 'addon', or 'combo'"}), 400
                item = items_collection.find_one({'_id': item_id})
                if not item:
                    logger.warning(f"Item not found: {item_id}")
                    return jsonify({"error": "Item not found"}), 404
                ingredients = []
                if item_type == 'item':
                    ingredients = item.get('ingredients', [])
                elif item_type == 'addon':
                    if index is None or not index.isdigit():
                        logger.error("Index is required for addons")
                        return jsonify({"error": "Index is required for addons"}), 400
                    index = int(index)
                    if index < len(item.get('addons', [])):
                        ingredients = item['addons'][index].get('ingredients', [])
                elif item_type == 'combo':
                    if index is None or not index.isdigit():
                        logger.error("Index is required for combos")
                        return jsonify({"error": "Index is required for combos"}), 400
                    index = int(index)
                    if index < len(item.get('combos', [])):
                        ingredients = item['combos'][index].get('ingredients', [])
                response_data = {'ingredients': ingredients, 'nutrition': {}}
                logger.info(f"Fetched nutrition data for {item_type}: {item_name}")
                return jsonify(response_data), 200
            if request.method == 'DELETE':
                instances = request.headers.get('X-Instances')
                if not instances:
                    logger.error("Instances header is required for DELETE")
                    return jsonify({"error": "Instances header is required"}), 400
                try:
                    instances = json.loads(instances)
                except json.JSONDecodeError:
                    logger.error("Invalid instances header format")
                    return jsonify({"error": "Invalid instances header format"}), 400
                if item_type not in ['item', 'addon', 'combo']:
                    logger.error(f"Invalid type: {item_type}")
                    return jsonify({"error": "Invalid type, must be 'item', 'addon', or 'combo'"}), 400
                deleted_count = 0
                for instance in instances:
                    item_id = instance['item_id']
                    index = instance.get('index')
                    item = items_collection.find_one({'_id': item_id})
                    if not item:
                        logger.warning(f"Item not found: {item_id}")
                        continue
                    update_data = {'$unset': {}, '$set': {'modified_at': datetime.now(ZoneInfo("UTC")).isoformat()}}
                    if item_type == 'item':
                        update_data['$unset']['ingredients'] = ''
                    elif item_type == 'addon':
                        if index is None or not isinstance(index, int):
                            logger.error(f"Index is required for addons in item_id: {item_id}")
                            continue
                        update_data['$unset'][f'addons.{index}.ingredients'] = ''
                    elif item_type == 'combo':
                        if index is None or not isinstance(index, int):
                            logger.error(f"Index is required for combos in item_id: {item_id}")
                            continue
                        update_data['$unset'][f'combos.{index}.ingredients'] = ''
                    result = items_collection.update_one({'_id': item_id}, update_data)
                    if result.matched_count > 0:
                        deleted_count += 1
                if deleted_count == 0:
                    logger.error(f"No items updated for deletion of {item_type}: {item_name}")
                    return jsonify({"error": "No items updated for deletion, please check instance data"}), 400
                logger.info(f"Nutrition cleared for {item_type}: {item_name} across {deleted_count} instances")
                return jsonify({"message": "Nutrition and ingredients cleared successfully"}), 200
        except Exception as e:
            logger.error(f"Error handling nutrition for {item_name}: {str(e)}")
            return jsonify({"error": f"Server error: {str(e)}"}), 500
    @app.route('/api/kitchen-saved', methods=['POST'])
    @db_required
    def save_kitchen_order():
        try:
            data = request.get_json()
            if not data or 'orderId' not in data:
                return jsonify({'success': False, 'error': 'No data or orderId provided'}), 400
            order_id = data['orderId']
            existing_order = kitchen_saved_collection.find_one({'orderId': order_id})
            cart_items = data.get('cartItems', [])
            for item in cart_items:
                required_kitchens = set()
                if 'kitchen' in item:
                    required_kitchens.add(item['kitchen'])
                for addon_name, qty in item.get('addonQuantities', {}).items():
                    if qty > 0 and 'addonVariants' in item and addon_name in item['addonVariants']:
                        addon = item['addonVariants'][addon_name]
                        if 'kitchen' in addon:
                            required_kitchens.add(addon['kitchen'])
                for combo_name, qty in item.get('comboQuantities', {}).items():
                    if qty > 0 and 'comboVariants' in item and combo_name in item['comboVariants']:
                        combo = item['comboVariants'][combo_name]
                        if 'kitchen' in combo:
                            required_kitchens.add(combo['kitchen'])
                item['requiredKitchens'] = list(required_kitchens)
                item['kitchenStatuses'] = item.get('kitchenStatuses', {kitchen: 'Pending' for kitchen in required_kitchens})
                item['kitchenStatuses'] = item.get('kitchenStatuses', {kitchen: 'Pending' for kitchen in required_kitchens})
            order = {
                'orderId': order_id,
                'customerName': data.get('customerName', 'N/A'),
                'tableNumber': data.get('tableNumber', 'N/A'),
                'chairsBooked': data.get('chairsBooked', []),
                'pickupTime': data.get('pickupTime', ''),
                'deliveryAddress': data.get('deliveryAddress', {}),
                'whatsappNumber': data.get('whatsappNumber', ''),
                'email': data.get('email', ''),
                'cartItems': cart_items,
                'timestamp': data.get('timestamp', datetime.now(timezone.utc).isoformat()),
                'orderType': data.get('orderType', 'Dine In'),
                'status': data.get('status', 'Pending'),
                'createdAt': datetime.now(timezone.utc).isoformat(),
                'pickedUpTime': data.get('pickedUpTime', None)
            }
            if existing_order:
                kitchen_saved_collection.update_one(
                    {'orderId': order_id},
                    {'$set': order}
                )
                logger.info(f"Updated kitchen order: {order_id}")
            else:
                kitchen_saved_collection.insert_one(order)
                logger.info(f"Created kitchen order: {order_id}")
            return jsonify({'success': True, 'order_id': order_id}), 201
        except Exception as e:
            logger.error(f"Error in /api/kitchen-saved POST: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'success': False, 'error': str(e)}), 500
    @app.route('/api/kitchen-saved', methods=['GET'])
    @db_required
    def get_kitchen_orders():
        try:
            orders = kitchen_saved_collection.find()
            return jsonify({'success': True, 'orders': convert_objectid_to_str(orders)}), 200
        except Exception as e:
            logger.error(f"Error in /api/kitchen-saved GET: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'success': False, 'error': str(e)}), 500
    @app.route('/api/kitchen-saved/<order_id>', methods=['DELETE'])
    @db_required
    def delete_kitchen_order(order_id):
        try:
            result = kitchen_saved_collection.delete_one({'orderId': order_id})
            if result.deleted_count == 0:
                logger.warning(f"Order not found: {order_id}")
                return jsonify({'success': False, 'error': 'Order not found'}), 404
            logger.info(f"Order deleted: {order_id}")
            return jsonify({'success': True, 'message': 'Order deleted successfully'}), 200
        except Exception as e:
            logger.error(f"Error deleting order {order_id}: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'success': False, 'error': str(e)}), 500
    @app.route('/api/kitchen-saved/<order_id>/items/<item_id>/mark-prepared', methods=['POST'])
    @db_required
    def mark_item_prepared(order_id, item_id):
        try:
            data = request.get_json()
            kitchen = data.get('kitchen')
            if not kitchen:
                return jsonify({'success': False, 'error': 'Kitchen not provided'}), 400
            order = kitchen_saved_collection.find_one({'orderId': order_id})
            if not order:
                return jsonify({'success': False, 'error': 'Order not found'}), 404
            item = next((item for item in order['cartItems'] if item['id'] == item_id), None)
            if not item:
                return jsonify({'success': False, 'error': 'Item not found'}), 404
            if not item.get('requiredKitchens') or kitchen not in item['requiredKitchens']:
                return jsonify({'success': False, 'error': 'Kitchen not required for this item'}), 400
            if not item.get('kitchenStatuses'):
                item['kitchenStatuses'] = {k: 'Pending' for k in item['requiredKitchens']}
            if item['kitchenStatuses'][kitchen] in ['Prepared', 'PickedUp']:
                return jsonify({'success': False, 'error': 'Kitchen already marked as prepared or picked up'}), 400
            item['kitchenStatuses'][kitchen] = 'Prepared'
            kitchen_saved_collection.update_one(
                {'orderId': order_id, 'cartItems.id': item_id},
                {'$set': {'cartItems.$.kitchenStatuses': item['kitchenStatuses']}}
            )
            activeorders_collection.update_one(
                {'orderId': order_id, 'cartItems.id': item_id},
                {'$set': {'cartItems.$.kitchenStatuses': item['kitchenStatuses']}}
            )
            return jsonify({'success': True, 'status': 'Prepared'}), 200
        except Exception as e:
            logger.error(f"Error in /api/kitchen-saved/{order_id}/items/{item_id}/mark-prepared: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'success': False, 'error': str(e)}), 500
    @app.route('/api/picked-up-items', methods=['POST'])
    @db_required
    def save_picked_up_item():
        try:
            item_data = request.get_json()
            if not item_data:
                logger.error("No data provided for picked-up items")
                return jsonify({'success': False, 'message': 'No data provided'}), 400
            customer_name = item_data.get('customerName', 'Unknown')
            table_number = item_data.get('tableNumber', 'N/A')
            pickup_time = datetime.now(timezone.utc).isoformat()
            new_item = {
                'itemName': item_data.get('itemName', 'Unknown'),
                'quantity': item_data.get('quantity', 0),
                'category': item_data.get('category', 'N/A'),
                'kitchen': item_data.get('kitchen', 'Unknown'),
                'addonCounts': item_data.get('addonCounts', []),
                'selectedCombos': item_data.get('selectedCombos', [])
            }
            existing_entry = picked_up_collection.find_one({
                'customerName': customer_name,
                'tableNumber': table_number
            })
            if existing_entry:
                updated_items = existing_entry.get('items', [])
                updated_items.append(new_item)
                picked_up_collection.update_one(
                    {'_id': existing_entry['_id']},
                    {
                        '$set': {
                            'items': updated_items,
                            'pickupTime': pickup_time,
                            'modified_at': datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                logger.info(f"Picked-up items updated for customer: {customer_name}, table: {table_number}")
                return jsonify({
                    'success': True,
                    'message': 'Picked-up items updated successfully',
                    'id': existing_entry['_id']
                }), 200
            else:
                picked_up_data = {
                    'customerName': customer_name,
                    'tableNumber': table_number,
                    'items': [new_item],
                    'pickupTime': pickup_time,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'orderType': item_data.get('orderType', 'N/A')
                }
                result = picked_up_collection.insert_one(picked_up_data)
                logger.info(f"Picked-up items saved with ID: {result.inserted_id}")
                return jsonify({
                    'success': True,
                    'message': 'Picked-up items saved successfully',
                    'id': result.inserted_id
                }), 201
        except Exception as e:
            logger.error(f"Error saving picked-up items: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'success': False, 'message': str(e)}), 500
    @app.route('/api/picked-up-items', methods=['GET'])
    @db_required
    def get_picked_up_items():
        try:
            picked_up_items = picked_up_collection.find()
            picked_up_items = convert_objectid_to_str(picked_up_items)
            logger.info(f"Fetched {len(picked_up_items)} picked-up item entries")
            return jsonify({'success': True, 'pickedUpItems': picked_up_items}), 200
        except Exception as e:
            logger.error(f"Error fetching picked-up items: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'success': False, 'message': str(e)}), 500
    @app.route('/api/picked-up-items/<entry_id>', methods=['DELETE'])
    @db_required
    def delete_picked_up_item(entry_id):
        try:
            result = picked_up_collection.delete_one({'_id': entry_id})
            if result.deleted_count == 0:
                logger.warning(f"Picked-up entry not found: {entry_id}")
                return jsonify({"error": "Picked-up entry not found"}), 404
            logger.info(f"Picked-up entry deleted: {entry_id}")
            return jsonify({"message": "Picked-up entry deleted successfully"}), 200
        except Exception as e:
            logger.error(f"Error deleting picked-up entry {entry_id}: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
    @app.route('/api/variants', methods=['POST'])
    @db_required
    def create_variants():
        try:
            data = request.get_json()
            if not data or not data.get('heading') or not isinstance(data.get('subheadings'), list):
                return jsonify({'error': 'Variant must have a heading and a list of subheadings'}), 400
            for subheading in data['subheadings']:
                if not subheading.get('name'):
                    return jsonify({'error': 'Each subheading must have a name'}), 400
                if 'price' in subheading and subheading['price'] is not None:
                    try:
                        subheading['price'] = float(subheading['price'])
                    except (ValueError, TypeError):
                        return jsonify({'error': f"Invalid price for subheading {subheading['name']}"}), 400
                if 'image' in subheading and subheading['image'] is not None:
                    if not isinstance(subheading['image'], str):
                        return jsonify({'error': f"Image for subheading {subheading['name']} must be a string"}), 400
                if 'dropdown' in subheading and not isinstance(subheading['dropdown'], bool):
                    return jsonify({'error': f"Dropdown for subheading {subheading['name']} must be a boolean"}), 400
            result = variants_collection.insert_one(data)
            return jsonify({
                'message': 'Variant created successfully',
                'inserted_id': result.inserted_id
            }), 201
        except Exception as e:
            return jsonify({'error': f"Server error: {str(e)}"}), 500
    @app.route('/api/variants', methods=['GET'])
    @db_required
    def get_variants():
        try:
            placeholder_url = 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=No+Image'
            variants = variants_collection.find()
            variants_list = []
            for variant in variants:
                variant = convert_objectid_to_str(variant)
                for subheading in variant.get('subheadings', []):
                    if subheading.get('image'):
                        subheading['image'] = f"/api/images/{os.path.basename(subheading['image'])}"
                    else:
                        subheading['image'] = placeholder_url
                variants_list.append(variant)
            return jsonify(variants_list), 200
        except Exception as e:
            return jsonify({'error': f"Server error: {str(e)}"}), 500
    @app.route('/api/variants/<id>', methods=['GET'])
    @db_required
    def get_variant(id):
        try:
            variant = variants_collection.find_one({'_id': id})
            if not variant:
                return jsonify({'error': 'Variant not found'}), 404
            variant = convert_objectid_to_str(variant)
            placeholder_url = 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=No+Image'
            for subheading in variant.get('subheadings', []):
                if subheading.get('image'):
                    subheading['image'] = f"/api/images/{os.path.basename(subheading['image'])}"
                else:
                    subheading['image'] = placeholder_url
            return jsonify(variant), 200
        except Exception as e:
            return jsonify({'error': f"Server error: {str(e)}"}), 500
    @app.route('/api/variants/<id>', methods=['PUT'])
    @db_required
    def update_variant(id):
        try:
            data = request.get_json()
            if not data or not data.get('heading') or not isinstance(data.get('subheadings'), list):
                return jsonify({'error': 'Variant must have a heading and a list of subheadings'}), 400
            for subheading in data['subheadings']:
                if not subheading.get('name'):
                    return jsonify({'error': 'Each subheading must have a name'}), 400
                if 'price' in subheading and subheading['price'] is not None:
                    try:
                        subheading['price'] = float(subheading['price'])
                    except (ValueError, TypeError):
                        return jsonify({'error': f"Invalid price for subheading {subheading['name']}"}), 400
                if 'image' in subheading and subheading['image'] is not None:
                    if not isinstance(subheading['image'], str):
                        return jsonify({'error': f"Image for subheading {subheading['name']} must be a string"}), 400
                if 'dropdown' in subheading and not isinstance(subheading['dropdown'], bool):
                    return jsonify({'error': f"Dropdown for subheading {subheading['name']} must be a boolean"}), 400
            result = variants_collection.update_one(
                {'_id': id},
                {'$set': data}
            )
            if result.matched_count == 0:
                return jsonify({'error': 'Variant not found'}), 404
            return jsonify({'message': 'Variant updated successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Server error: {str(e)}"}), 500
    @app.route('/api/variants/<id>', methods=['DELETE'])
    @db_required
    def delete_variant(id):
        try:
            result = variants_collection.delete_one({'_id': id})
            if result.deleted_count == 0:
                return jsonify({'error': 'Variant not found'}), 404
            return jsonify({'message': 'Variant deleted successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Server error: {str(e)}"}), 500
    @app.route('/api/variants/heading/<heading>', methods=['DELETE'])
    @db_required
    def delete_variant_by_heading(heading):
        try:
            result = variants_collection.delete_one({'heading': heading})
            return jsonify({'message': 'Variant deleted successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Server error: {str(e)}"}), 500
    VALID_COUNTRY_CODES = [
        '+91', # India
        '+1', # USA
        '+971', # UAE (Dubai)
        '+44', # UK
        '+61', # Australia
    ]
    def generate_employee_id():
        """Generate a unique employee ID."""
        return str(uuid.uuid4())[:8]
    def validate_email(email):
        """Validate email format."""
        import re
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        return re.match(pattern, email) is not None
    @app.route('/api/employees', methods=['GET'])
    @db_required
    def get_employees():
        try:
            employees = employees_collection.find()
            return jsonify(convert_objectid_to_str(employees)), 200
        except Exception as e:
            logger.error(f"Error fetching employees: {str(e)}")
            return jsonify({'error': str(e)}), 500
    @app.route('/api/employees', methods=['POST'])
    @db_required
    def create_employee():
        try:
            data = request.get_json()
            required_fields = ['name', 'phoneNumber', 'vehicleNumber', 'role', 'email']
            if not data or not all(key in data for key in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
            phone_number = data['phoneNumber']
            if not any(phone_number.startswith(code) for code in VALID_COUNTRY_CODES):
                return jsonify({'error': 'Phone number must include a valid country code (e.g., +91, +1, +971)'}), 400
            code_length = len(next(code for code in VALID_COUNTRY_CODES if phone_number.startswith(code)))
            if len(phone_number) < code_length + 7:
                return jsonify({'error': 'Phone number is too short'}), 400
            email = data['email']
            if not validate_email(email):
                return jsonify({'error': 'Invalid email format'}), 400
            if employees_collection.find_one({'email': email}):
                return jsonify({'error': 'Email already exists'}), 400
            employee_id = generate_employee_id()
            employee = {
                'employeeId': employee_id,
                'name': data['name'],
                'phoneNumber': phone_number,
                'vehicleNumber': data['vehicleNumber'],
                'role': data['role'],
                'email': email
            }
            employees_collection.insert_one(employee)
            if not users_collection.find_one({'email': email}):
                users_collection.insert_one({
                    'email': email,
                    'name': data['name'],
                    'role': data['role'],
                    'created_at': datetime.now(ZoneInfo("UTC")).isoformat()
                })
            logger.info(f"Created employee: {employee_id} with email: {email}")
            return jsonify({'message': 'Employee created successfully', 'employee': employee}), 201
        except Exception as e:
            logger.error(f"Error creating employee: {str(e)}")
            return jsonify({'error': str(e)}), 500
    @app.route('/api/employees/<employee_id>', methods=['PUT'])
    @db_required
    def update_employee(employee_id):
        try:
            data = request.get_json()
            required_fields = ['name', 'phoneNumber', 'vehicleNumber', 'role', 'email']
            if not data or not all(key in data for key in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
            phone_number = data['phoneNumber']
            if not any(phone_number.startswith(code) for code in VALID_COUNTRY_CODES):
                return jsonify({'error': 'Phone number must include a valid country code (e.g., +91, +1, +971)'}), 400
            code_length = len(next(code for code in VALID_COUNTRY_CODES if phone_number.startswith(code)))
            if len(phone_number) < code_length + 7:
                return jsonify({'error': 'Phone number is too short'}), 400
            email = data['email']
            if not validate_email(email):
                return jsonify({'error': 'Invalid email format'}), 400
            existing_employee = employees_collection.find_one({'email': email, 'employeeId': {'$ne': employee_id}})
            if existing_employee:
                return jsonify({'error': 'Email already exists'}), 400
            updated_employee = {
                'name': data['name'],
                'phoneNumber': phone_number,
                'vehicleNumber': data['vehicleNumber'],
                'role': data['role'],
                'email': email
            }
            result = employees_collection.update_one(
                {'employeeId': employee_id},
                {'$set': updated_employee}
            )
            if result.matched_count == 0:
                return jsonify({'error': 'Employee not found'}), 404
            users_collection.update_one(
                {'email': email},
                {'$set': {
                    'email': email,
                    'name': data['name'],
                    'role': data['role'],
                    'updated_at': datetime.now(ZoneInfo("UTC")).isoformat()
                }},
                upsert=True
            )
            logger.info(f"Updated employee: {employee_id} with email: {email}")
            return jsonify({'message': 'Employee updated successfully'}), 200
        except Exception as e:
            logger.error(f"Error updating employee: {str(e)}")
            return jsonify({'error': str(e)}), 500
    @app.route('/api/employees/<employee_id>', methods=['DELETE'])
    @db_required
    def delete_employee(employee_id):
        try:
            employee = employees_collection.find_one({'employeeId': employee_id})
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            result = employees_collection.delete_one({'employeeId': employee_id})
            if result.deleted_count == 0:
                return jsonify({'error': 'Employee not found'}), 404
            if not employees_collection.find_one({'email': employee['email']}):
                users_collection.delete_one({'email': employee['email']})
            logger.info(f"Deleted employee: {employee_id}")
            return jsonify({'message': 'Employee deleted successfully'}), 200
        except Exception as e:
            logger.error(f"Error deleting employee: {str(e)}")
            return jsonify({"error": str(e)}), 500
    def generate_order_number(order_type):
        counter_doc = order_counters_collection.find_one_and_update(
            {'_id': order_type},
            {'$inc': {'count': 1}},
            upsert=True,
            return_document=True
        )
        return f"{order_type}-{counter_doc['count']:04d}"
    # @app.route('/api/activeorders', methods=['POST'])
    # @db_required
    # def save_active_order():
    #     try:
    #         data = request.get_json()
    #         order_type = data.get('orderType', 'Dine In')
    #         order_no = generate_order_number(order_type)
    #         cart_items = data.get('cartItems', [])
    #         for item in cart_items:
    #             required_kitchens = set()
    #             if item.get('kitchen'):
    #                 required_kitchens.add(item['kitchen'])
    #             for addon_name, qty in item.get('addonQuantities', {}).items():
    #                 if qty > 0 and 'addonVariants' in item and addon_name in item['addonVariants']:
    #                     if item['addonVariants'][addon_name].get('kitchen'):
    #                         required_kitchens.add(item['addonVariants'][addon_name]['kitchen'])
    #             for combo_name, qty in item.get('comboQuantities', {}).items():
    #                 if qty > 0 and 'comboVariants' in item and combo_name in item['comboVariants']:
    #                     if item['comboVariants'][combo_name].get('kitchen'):
    #                         required_kitchens.add(item['comboVariants'][combo_name]['kitchen'])
    #             item['requiredKitchens'] = list(required_kitchens)
    #             item['kitchenStatuses'] = {kitchen: 'Pending' for kitchen in required_kitchens}
    #         active_order = {
    #             'orderId': str(uuid.uuid4()),
    #             'orderNo': order_no,
    #             'customerName': data.get('customerName', 'N/A'),
    #             'tableNumber': data.get('tableNumber', 'N/A'),
    #             'chairsBooked': data.get('chairsBooked', []),
    #             'phoneNumber': data.get('phoneNumber', ''),
    #             'deliveryAddress': data.get('deliveryAddress', {}),
    #             'whatsappNumber': data.get('whatsappNumber', ''),
    #             'email': data.get('email', ''),
    #             'cartItems': cart_items,
    #             'timestamp': data.get('timestamp', datetime.now(timezone.utc).isoformat()),
    #             'orderType': order_type,
    #             'status': data.get('status', 'Pending'),
    #             'created_at': datetime.now(timezone.utc),
    #             'deliveryPersonId': data.get('deliveryPersonId', ''),
    #             'deliveryPersonName': data.get('deliveryPersonName', ''),
    #             'pickedUpTime': data.get('pickedUpTime', None),
    #             'served': False
    #         }
    #         activeorders_collection.insert_one(active_order)
    #         kitchen_saved_collection.insert_one(active_order.copy())
    #         logger.info(f"Created order: {active_order['orderId']} with order number: {order_no}")
    #         return jsonify({'success': True, 'orderId': active_order['orderId'], 'orderNo': order_no}), 201
    #     except Exception as e:
    #         logger.error(f"Error saving active order: {str(e)}")
    #         logger.error(traceback.format_exc())
    #         return jsonify({'error': str(e)}), 500
    # @app.route('/api/activeorders', methods=['GET'])
    # @db_required
    # def get_active_orders():
    #     try:
    #         orders = activeorders_collection.find()
    #         return jsonify(convert_objectid_to_str(orders)), 200
    #     except Exception as e:
    #         logger.error(f"Error fetching active orders: {str(e)}")
    #         logger.error(traceback.format_exc())
    #         return jsonify({'error': str(e)}), 500
    # @app.route('/api/activeorders/<order_id>/items/<item_id>/mark-prepared', methods=['POST'])
    # @db_required
    # def mark_item_prepared_active(order_id, item_id):
    #     try:
    #         data = request.get_json()
    #         kitchen = data.get('kitchen')
    #         if not kitchen:
    #             return jsonify({'success': False, 'error': 'Kitchen not provided'}), 400
    #         for collection in [activeorders_collection, kitchen_saved_collection]:
    #             order = collection.find_one({'orderId': order_id})
    #             if not order:
    #                 return jsonify({'success': False, 'error': 'Order not found'}), 404
    #             found = False
    #             for item in order['cartItems']:
    #                 if item['id'] == item_id:
    #                     if 'kitchenStatuses' not in item:
    #                         item['kitchenStatuses'] = {}
    #                     if item['kitchenStatuses'].get(kitchen) in ['Prepared', 'PickedUp']:
    #                         return jsonify({'success': False, 'error': 'Kitchen already marked as prepared or picked up'}), 400
    #                     item['kitchenStatuses'][kitchen] = 'Prepared'
    #                     found = True
    #                     break
    #             if not found:
    #                 return jsonify({'success': False, 'error': 'Item not found'}), 404
    #             collection.replace_one({'orderId': order_id}, order)
    #         logger.info(f"Marked item {item_id} in order {order_id} as Prepared for kitchen {kitchen}")
    #         return jsonify({'success': True, 'status': 'Prepared'}), 200
    #     except Exception as e:
    #         logger.error(f"Error in mark-prepared: {str(e)}")
    #         logger.error(traceback.format_exc())
    #         return jsonify({'success': False, 'error': str(e)}), 500
    # @app.route('/api/activeorders/<order_id>/items/<item_id>/mark-pickedup', methods=['POST'])
    # @db_required
    # def mark_item_pickedup_active(order_id, item_id):
    #     try:
    #         data = request.get_json()
    #         kitchen = data.get('kitchen')
    #         if not kitchen:
    #             return jsonify({'success': False, 'error': 'Kitchen not provided'}), 400
    #         for collection in [activeorders_collection, kitchen_saved_collection]:
    #             order = collection.find_one({'orderId': order_id})
    #             if not order:
    #                 return jsonify({'success': False, 'error': 'Order not found'}), 404
    #             found = False
    #             for item in order['cartItems']:
    #                 if item['id'] == item_id:
    #                     if 'kitchenStatuses' not in item:
    #                         item['kitchenStatuses'] = {}
    #                     status = item['kitchenStatuses'].get(kitchen)
    #                     if status == 'Pending':
    #                         logger.warning(f"Item {item_id} in order {order_id} was Pending, setting to Prepared automatically for kitchen {kitchen}")
    #                         item['kitchenStatuses'][kitchen] = 'Prepared'
    #                     elif status != 'Prepared':
    #                         return jsonify({'success': False, 'error': 'Item must be prepared before picking up'}), 400
    #                     item['kitchenStatuses'][kitchen] = 'PickedUp'
    #                     found = True
    #                     break
    #             if not found:
    #                 return jsonify({'success': False, 'error': 'Item not found'}), 404
    #             collection.replace_one({'orderId': order_id}, order)
    #         order = activeorders_collection.find_one({'orderId': order_id})  # Reload to get updated
    #         picked_up_data = {
    #             'customerName': order.get('customerName', 'Unknown'),
    #             'tableNumber': order.get('tableNumber', 'N/A'),
    #             'items': order.get('cartItems', []),
    #             'pickupTime': datetime.now(timezone.utc).isoformat(),
    #             'orderType': order.get('orderType', 'Dine In')
    #         }
    #         picked_up_collection.insert_one(picked_up_data)
    #         logger.info(f"Marked item {item_id} in order {order_id} as PickedUp for kitchen {kitchen}")
    #         return jsonify({'success': True, 'status': 'PickedUp'}), 200
    #     except Exception as e:
    #         logger.error(f"Error in mark-pickedup: {str(e)}")
    #         logger.error(traceback.format_exc())
    #         return jsonify({'success': False, 'error': str(e)}), 500
    # @app.route('/api/activeorders/<order_id>', methods=['PUT'])
    # @db_required
    # def update_active_order(order_id):
    #     try:
    #         data = request.get_json()
    #         if '_id' in data:
    #             del data['_id']
    #         order_in_db = activeorders_collection.find_one({'orderId': order_id})
    #         if not order_in_db:
    #             logger.warning(f"Order not found for update: {order_id}")
    #             return jsonify({'error': 'Order not found'}), 404
    #         old_statuses_map = {
    #             item['id']: item.get('kitchenStatuses', {})
    #             for item in order_in_db.get('cartItems', []) if 'id' in item
    #         }
    #         if 'cartItems' in data:
    #             for item in data['cartItems']:
    #                 required_kitchens = set()
    #                 if item.get('kitchen'):
    #                     required_kitchens.add(item['kitchen'])
    #                 for addon_name, qty in item.get('addonQuantities', {}).items():
    #                     if qty > 0 and 'addonVariants' in item and addon_name in item['addonVariants']:
    #                         if item['addonVariants'][addon_name].get('kitchen'):
    #                             required_kitchens.add(item['addonVariants'][addon_name]['kitchen'])
    #                 for combo_name, qty in item.get('comboQuantities', {}).items():
    #                     if qty > 0 and 'comboVariants' in item and combo_name in item['comboVariants']:
    #                         if item['comboVariants'][combo_name].get('kitchen'):
    #                             required_kitchens.add(item['comboVariants'][combo_name]['kitchen'])
    #                 item['requiredKitchens'] = list(required_kitchens)
    #                 item_id = item.get('id')
    #                 old_item_status_statuses = old_statuses_map.get(item_id, {})
    #                 new_kitchen_statuses = {}
    #                 for kitchen in required_kitchens:
    #                     if kitchen in old_item_status_statuses:
    #                         new_kitchen_statuses[kitchen] = old_item_status_statuses[kitchen]
    #                     else:
    #                         new_kitchen_statuses[kitchen] = 'Pending'
    #                 item['kitchenStatuses'] = new_kitchen_statuses
    #         updated_order = {**order_in_db, **data}
    #         if 'cartItems' in data:
    #             updated_order['cartItems'] = data['cartItems']
    #         if 'deliveryPersonId' in updated_order and updated_order['deliveryPersonId']:
    #             employee = employees_collection.find_one({'employeeId': updated_order['deliveryPersonId']})
    #             if not employee:
    #                 logger.warning(f"Delivery person not found: {updated_order['deliveryPersonId']}")
    #                 return jsonify({'error': 'Delivery person not found'}), 404
    #             trip_report = {
    #                 'tripId': str(uuid.uuid4()),
    #                 'orderId': updated_order['orderId'],
    #                 'orderNo': updated_order['orderNo'],
    #                 'customerName': updated_order.get('customerName', 'N/A'),
    #                 'tableNumber': updated_order.get('tableNumber', 'N/A'),
    #                 'chairsBooked': updated_order.get('chairsBooked', []),
    #                 'phoneNumber': updated_order.get('phoneNumber', ''),
    #                 'deliveryAddress': updated_order.get('deliveryAddress', {}),
    #                 'whatsappNumber': updated_order.get('whatsappNumber', ''),
    #                 'email': updated_order.get('email', ''),
    #                 'cartItems': updated_order.get('cartItems', []),
    #                 'timestamp': updated_order.get('timestamp', datetime.now(timezone.utc).isoformat()),
    #                 'orderType': updated_order.get('orderType', 'Dine In'),
    #                 'status': updated_order.get('status', 'Pending'),
    #                 'deliveryPersonId': updated_order['deliveryPersonId'],
    #                 'deliveryPersonName': updated_order.get('deliveryPersonName', employee.get('name', 'N/A')),
    #                 'pickedUpTime': updated_order.get('pickedUpTime', None),
    #                 'paymentMethods': updated_order.get('paymentMethods', []),
    #                 'cardDetails': updated_order.get('cardDetails', ''),
    #                 'upiDetails': updated_order.get('upiDetails', ''),
    #                 'created_at': datetime.now(timezone.utc)
    #             }
    #             tripreports_collection.insert_one(trip_report)
    #             logger.info(f"Saved trip report for order {order_id} with delivery person {updated_order['deliveryPersonId']}")
    #             activeorders_collection.delete_one({'orderId': order_id})
    #             kitchen_saved_collection.delete_one({'orderId': order_id})
    #             logger.info(f"Deleted order {order_id} from active orders after delivery person assignment")
    #             return jsonify({'success': True, 'message': 'Delivery person assigned and order moved to trip reports', 'order': convert_objectid_to_str(updated_order)}), 200
    #         if updated_order.get('paid', False) and updated_order.get('served', False) and updated_order.get('orderType') != 'Online Delivery':
    #             activeorders_collection.delete_one({'orderId': order_id})
    #             kitchen_saved_collection.delete_one({'orderId': order_id})
    #             logger.info(f"Deleted served and paid order {order_id} from active orders")
    #             return jsonify({'success': True, 'message': 'Order updated and deleted as served and paid', 'order': convert_objectid_to_str(updated_order)}), 200
    #         result = activeorders_collection.replace_one({'orderId': order_id}, updated_order)
    #         kitchen_result = kitchen_saved_collection.replace_one({'orderId': order_id}, updated_order)
    #         updated_order = activeorders_collection.find_one({'orderId': order_id})
    #         if result.matched_count > 0 or kitchen_result.matched_count > 0:
    #             logger.info(f"Updated order: {order_id}")
    #             return jsonify({'success': True, 'message': 'Order updated', 'order': convert_objectid_to_str(updated_order)}), 200
    #         logger.info(f"No changes made to order: {order_id}")
    #         return jsonify({'success': True, 'message': 'No changes made', 'order': convert_objectid_to_str(updated_order)}), 200
    #     except Exception as e:
    #         logger.error(f"Error updating active order: {str(e)}")
    #         logger.error(traceback.format_exc())
    #         return jsonify({'error': str(e)}), 500
    # @app.route('/api/activeorders/<order_id>', methods=['DELETE'])
    # @db_required
    # def delete_order(order_id):
    #     try:
    #         result = activeorders_collection.delete_one({'orderId': order_id})
    #         kitchen_result = kitchen_saved_collection.delete_one({'orderId': order_id})
    #         if result.deleted_count > 0 or kitchen_result.deleted_count > 0:
    #             logger.info(f"Deleted order: {order_id}")
    #             return jsonify({'success': True}), 200
    #         logger.warning(f"Order not found for deletion: {order_id}")
    #         return jsonify({'error': 'Order not found'}), 404
    #     except Exception as e:
    #         logger.error(f"Error deleting order: {str(e)}")
    #         logger.error(traceback.format_exc())
    #         return jsonify({'error': str(e)}), 500
    @app.route('/api/tripreports/<employee_id>', methods=['GET'])
    @db_required
    def get_trip_reports(employee_id):
        try:
            trip_reports = tripreports_collection.find({'deliveryPersonId': employee_id})
            return jsonify(convert_objectid_to_str(trip_reports)), 200
        except Exception as e:
            logger.error(f"Error fetching trip reports: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'error': str(e)}), 500
    @app.route('/api/uoms', methods=['GET'])
    @db_required
    def get_uoms():
        try:
            uoms = uoms_collection.find()
            return jsonify(convert_objectid_to_str(uoms)), 200
        except Exception as e:
            return jsonify({'error': f"Failed to fetch UOMs: {str(e)}"}), 500
    @app.route('/api/uoms', methods=['POST'])
    @db_required
    def add_uom():
        try:
            data = request.json
            if not data or 'name' not in data or not data['name'].strip():
                return jsonify({'error': 'Invalid UOM name'}), 400
            if uoms_collection.find_one({'name': data['name']}):
                return jsonify({'error': 'UOM already exists'}), 400
            uom = {
                'name': data['name'].strip(),
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            result = uoms_collection.insert_one(uom)
            inserted_uom = uoms_collection.find_one({'_id': result.inserted_id})
            return jsonify(convert_objectid_to_str(inserted_uom)), 201
        except Exception as e:
            return jsonify({'error': f"Failed to add UOM: {str(e)}"}), 500
    @app.route('/api/uoms/<id>', methods=['PUT'])
    @db_required
    def update_uom(id):
        try:
            data = request.json
            if not data or 'name' not in data or not data['name'].strip():
                return jsonify({'error': 'Invalid UOM name'}), 400
            existing = uoms_collection.find_one({'name': data['name'], '_id': {'$ne': id}})
            if existing:
                return jsonify({'error': 'UOM name already exists'}), 400
            result = uoms_collection.update_one({'_id': id}, {'$set': {'name': data['name'].strip()}})
            if result.matched_count == 0:
                return jsonify({'error': 'UOM not found or no changes'}), 404
            return jsonify({'message': 'UOM updated successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Failed to update UOM: {str(e)}"}), 500
    @app.route('/api/uoms/<id>', methods=['DELETE'])
    @db_required
    def delete_uom(id):
        try:
            result = uoms_collection.delete_one({'_id': id})
            if result.deleted_count == 0:
                return jsonify({'error': 'UOM not found'}), 404
            return jsonify({'message': 'UOM deleted successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Failed to delete UOM: {str(e)}"}), 500
    @app.route('/api/purchase_items', methods=['GET'])
    @db_required
    def get_purchase_items():
        try:
            items = purchase_items_collection.find()
            return jsonify(convert_objectid_to_str(items)), 200
        except Exception as e:
            return jsonify({'error': f"Failed to fetch items: {str(e)}"}), 500
    @app.route('/api/purchase_items', methods=['POST'])
    @db_required
    def add_purchase_item():
        try:
            data = request.json
            required_fields = ['company', 'name', 'boxToMaster', 'masterUnit', 'masterToOuter', 'outerUnit', 'outerToNos', 'nosUnit']
            if not all(key in data for key in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
            item = {
                'company': data['company'],
                'name': data['name'],
                'boxToMaster': float(data['boxToMaster']),
                'masterUnit': data['masterUnit'],
                'masterToOuter': float(data['masterToOuter']),
                'outerUnit': data['outerUnit'],
                'outerToNos': float(data['outerToNos']),
                'nosUnit': data['nosUnit'],
                'conversionFactor': float(data['masterToOuter']) * float(data['outerToNos']),
                'stockMaster': 0,
                'stockOuter': 0,
                'stockNos': 0,
                'soldNos': 0,
                'totalStock': 0,
                'totalPurchased': 0,
                'grams': float(data.get('grams', 0)),
                'suppliers': data.get('suppliers', []),
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            result = purchase_items_collection.insert_one(item)
            inserted_item = purchase_items_collection.find_one({'_id': result.inserted_id})
            return jsonify(convert_objectid_to_str(inserted_item)), 201
        except ValueError:
            return jsonify({'error': 'Invalid numeric value'}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to add item: {str(e)}"}), 500
    @app.route('/api/purchase_items/<id>', methods=['PUT'])
    @db_required
    def update_purchase_item(id):
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            old_item = purchase_items_collection.find_one({'_id': id})
            if not old_item:
                return jsonify({'error': 'Item not found'}), 404
            update_data = {}
            if "company" in data:
                update_data["company"] = data["company"]
            if "name" in data:
                update_data["name"] = data["name"]
            if "boxToMaster" in data:
                update_data["boxToMaster"] = float(data["boxToMaster"])
            if "masterUnit" in data:
                update_data["masterUnit"] = data["masterUnit"]
            if "masterToOuter" in data:
                update_data["masterToOuter"] = float(data["masterToOuter"])
            if "outerUnit" in data:
                update_data["outerUnit"] = data["outerUnit"]
            if "outerToNos" in data:
                update_data["outerToNos"] = float(data["outerToNos"])
            if "nosUnit" in data:
                update_data["nosUnit"] = data["nosUnit"]
            if "grams" in data:
                update_data["grams"] = float(data["grams"])
            if "suppliers" in data:
                update_data["suppliers"] = data["suppliers"]
            if any(key in update_data for key in ["masterToOuter", "outerToNos"]):
                masterToOuter = update_data.get("masterToOuter", old_item["masterToOuter"])
                outerToNos = update_data.get("outerToNos", old_item["outerToNos"])
                update_data["conversionFactor"] = masterToOuter * outerToNos
            result = purchase_items_collection.update_one({'_id': id}, {'$set': update_data})
            if result.matched_count == 0:
                return jsonify({'error': 'Item not found'}), 404
            return jsonify({'message': 'Item updated successfully'}), 200
        except ValueError:
            return jsonify({'error': 'Invalid input data'}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to update item: {str(e)}"}), 500
    @app.route('/api/purchase_items/<id>', methods=['DELETE'])
    @db_required
    def delete_purchase_item(id):
        try:
            result = purchase_items_collection.delete_one({'_id': id})
            if result.deleted_count == 0:
                return jsonify({'error': 'Item not found'}), 404
            return jsonify({'message': 'Item deleted successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Failed to delete item: {str(e)}"}), 500
    @app.route('/api/suppliers', methods=['GET'])
    @db_required
    def get_suppliers():
        try:
            suppliers = suppliers_collection.find()
            return jsonify(convert_objectid_to_str(suppliers)), 200
        except Exception as e:
            return jsonify({'error': f"Failed to fetch suppliers: {str(e)}"}), 500
    @app.route('/api/suppliers', methods=['POST'])
    @db_required
    def add_supplier():
        try:
            data = request.json
            supplier = {
                'company': data.get('company', ''),
                'code': data.get('code', ''),
                'supplier_names': data.get('supplier_names', []),
                'group': data.get('group', ''),
                'country': data.get('country', ''),
                'currency': data.get('currency', ''),
                'taxId': data.get('taxId', ''),
                'taxCategory': data.get('taxCategory', ''),
                'taxWithholdingCategory': data.get('taxWithholdingCategory', ''),
                'contacts': data.get('contacts', []),
                'paymentMode': data.get('paymentMode', ''),
                'paymentTerms': data.get('paymentTerms', ''),
                'creditLimit': float(data.get('creditLimit', 0)),
                'paymentTermsOverride': data.get('paymentTermsOverride', ''),
                'bankDetails': data.get('bankDetails', ''),
                'website': data.get('website', ''),
                'onTimeDelivery': float(data.get('onTimeDelivery', 0)),
                'defectRate': float(data.get('defectRate', 0)),
                'lastPurchaseDate': data.get('lastPurchaseDate', None),
                'lastPurchaseValue': float(data.get('lastPurchaseValue', 0)),
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            result = suppliers_collection.insert_one(supplier)
            inserted_supplier = suppliers_collection.find_one({'_id': result.inserted_id})
            return jsonify(convert_objectid_to_str(inserted_supplier)), 201
        except Exception as e:
            return jsonify({'error': f"Failed to add supplier: {str(e)}"}), 500
    @app.route('/api/suppliers/<id>', methods=['PUT'])
    @db_required
    def update_supplier(id):
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            update_fields = {}
            fields = [
                'company', 'code', 'supplier_names', 'group', 'country', 'currency',
                'taxId', 'taxCategory', 'taxWithholdingCategory', 'contacts',
                'paymentMode', 'paymentTerms', 'creditLimit', 'paymentTermsOverride',
                'bankDetails', 'website', 'onTimeDelivery', 'defectRate',
                'lastPurchaseDate', 'lastPurchaseValue'
            ]
            for field in fields:
                if field in data:
                    if field in ['creditLimit', 'onTimeDelivery', 'defectRate', 'lastPurchaseValue']:
                        update_fields[field] = float(data[field])
                    else:
                        update_fields[field] = data[field]
            result = suppliers_collection.update_one({'_id': id}, {'$set': update_fields})
            if result.matched_count == 0:
                return jsonify({'error': 'Supplier not found'}), 404
            return jsonify({'message': 'Supplier updated successfully'}), 200
        except ValueError:
            return jsonify({'error': 'Invalid input data'}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to update supplier: {str(e)}"}), 500
    @app.route('/api/suppliers/<id>', methods=['DELETE'])
    @db_required
    def delete_supplier(id):
        try:
            result = suppliers_collection.delete_one({'_id': id})
            if result.deleted_count == 0:
                return jsonify({'error': 'Supplier not found'}), 404
            return jsonify({'message': 'Supplier deleted successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Failed to delete supplier: {str(e)}"}), 500
    @app.route('/api/purchase_orders', methods=['GET'])
    @db_required
    def get_purchase_orders():
        try:
            orders = purchase_orders_collection.find()
            return jsonify(convert_objectid_to_str(orders)), 200
        except Exception as e:
            return jsonify({'error': f"Failed to fetch purchase orders: {str(e)}"}), 500
    @app.route('/api/purchase_orders', methods=['POST'])
    @db_required
    def add_purchase_order():
        try:
            data = request.json
            required_fields = ['series', 'date', 'company', 'supplierId', 'name', 'supplierCompany', 'address', 'phone', 'email', 'currency', 'items', 'taxes', 'subtotal', 'totalQuantity', 'totalTaxes', 'grandTotal', 'status']
            if not all(key in data for key in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
            if purchase_orders_collection.find_one({'series': data['series'] }):
                return jsonify({'error': 'Series already exists'}), 400
            supplier = suppliers_collection.find_one({'_id': data['supplierId']})
            if not supplier:
                return jsonify({'error': 'Supplier not found'}), 404
            items = []
            for item_data in data['items']:
                item_doc = purchase_items_collection.find_one({'_id': item_data['itemId']})
                if not item_doc:
                    return jsonify({'error': f"Item {item_data['itemId']} not found"}), 404
                items.append({
                    'itemId': item_data['itemId'],
                    'quantity': float(item_data['quantity']),
                    'uom': item_data['uom'],
                    'rate': float(item_data.get('rate', 0)),
                    'amount': float(item_data.get('amount', 0))
                })
            order = {
                'series': data['series'],
                'date': datetime.fromisoformat(str(data['date']).replace('Z', '+00:00')),
                'company': data['company'],
                'supplierId': data['supplierId'],
                'name': data['name'],
                'supplierCompany': data['supplierCompany'],
                'address': data['address'],
                'phone': data['phone'],
                'email': data['email'],
                'currency': data['currency'],
                'targetWarehouse': data.get('targetWarehouse', ''),
                'items': items,
                'taxes': data['taxes'],
                'subtotal': float(data['subtotal']),
                'totalQuantity': float(data['totalQuantity']),
                'totalTaxes': float(data['totalTaxes']),
                'grandTotal': float(data['grandTotal']),
                'status': data['status'],
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            result = purchase_orders_collection.insert_one(order)
            inserted_order = purchase_orders_collection.find_one({'_id': result.inserted_id})
            return jsonify(convert_objectid_to_str(inserted_order)), 201
        except ValueError as e:
            return jsonify({'error': f"Invalid data format: {str(e)}"}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to create purchase order: {str(e)}"}), 500
    @app.route('/api/purchase_orders/<id>', methods=['PUT'])
    @db_required
    def update_purchase_order(id):
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No input data provided'}), 400
            old_order = purchase_orders_collection.find_one({'_id': id})
            if not old_order:
                return jsonify({'error': 'Purchase Order not found'}), 404
            update_data = {}
            for field in ['series', 'date', 'company', 'supplierId', 'name', 'supplierCompany', 'address', 'phone', 'email', 'currency', 'targetWarehouse', 'items', 'taxes', 'subtotal', 'totalQuantity', 'totalTaxes', 'grandTotal', 'status']:
                if field in data:
                    if field == 'date':
                        update_data[field] = datetime.fromisoformat(str(data[field]).replace('Z', '+00:00'))
                    elif field in ['subtotal', 'totalQuantity', 'totalTaxes', 'grandTotal']:
                        update_data[field] = float(data[field])
                    elif field == 'items':
                        items = []
                        for item_data in data[field]:
                            items.append({
                                'itemId': item_data['itemId'],
                                'quantity': float(item_data['quantity']),
                                'uom': item_data['uom'],
                                'rate': float(item_data.get('rate', 0)),
                                'amount': float(item_data.get('amount', 0))
                            })
                        update_data[field] = items
                    else:
                        update_data[field] = data[field]
            if not update_data:
                return jsonify({'error': 'No fields to update'}), 400
            result = purchase_orders_collection.update_one({'_id': id}, {'$set': update_data})
            if result.matched_count == 0:
                return jsonify({'error': 'Purchase Order not found'}), 404
            return jsonify({'message': 'Purchase Order updated successfully'}), 200
        except ValueError as e:
            return jsonify({'error': f"Invalid data format: {str(e)}"}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to update purchase order: {str(e)}"}), 500
    @app.route('/api/purchase_orders/<id>', methods=['DELETE'])
    @db_required
    def delete_purchase_order(id):
        try:
            result = purchase_orders_collection.delete_one({'_id': id})
            if result.deleted_count == 0:
                return jsonify({'error': 'Purchase Order not found'}), 404
            return jsonify({'message': 'Purchase Order deleted successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Failed to delete purchase order: {str(e)}"}), 500
    @app.route('/api/purchase_receipts', methods=['GET'])
    @db_required
    def get_purchase_receipts():
        try:
            receipts = purchase_receipts_collection.find()
            return jsonify(convert_objectid_to_str(receipts)), 200
        except Exception as e:
            return jsonify({'error': f"Failed to fetch purchase receipts: {str(e)}"}), 500
    @app.route('/api/purchase_receipts', methods=['POST'])
    @db_required
    def add_purchase_receipt():
        try:
            data = request.json
            required_fields = ['series', 'date', 'poId', 'company', 'supplierId', 'name', 'supplierCompany', 'address', 'phone', 'email', 'items', 'taxes', 'subtotal', 'totalTaxes', 'grandTotal', 'status']
            if not all(key in data for key in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
            if purchase_receipts_collection.find_one({'series': data['series'] }):
                return jsonify({'error': 'Series already exists'}), 400
            po = purchase_orders_collection.find_one({'series': data['poId']})
            if not po:
                return jsonify({'error': 'Purchase Order not found'}), 404
            items = []
            for item_data in data['items']:
                item_doc = purchase_items_collection.find_one({'_id': item_data['itemId']})
                if not item_doc:
                    return jsonify({'error': f"Item {item_data['itemId']} not found"}), 404
                items.append({
                    'itemId': item_data['itemId'],
                    'originalQuantity': float(item_data['originalQuantity']),
                    'acceptedQuantity': float(item_data['acceptedQuantity']),
                    'rejectedQuantity': float(item_data['rejectedQuantity']),
                    'rate': float(item_data.get('rate', 0)),
                    'amount': float(item_data.get('amount', 0)),
                    'unit': item_data['unit']
                })
            receipt = {
                'series': data['series'],
                'date': datetime.fromisoformat(str(data['date']).replace('Z', '+00:00')),
                'poId': data['poId'],
                'company': data['company'],
                'supplierId': data['supplierId'],
                'name': data['name'],
                'supplierCompany': data['supplierCompany'],
                'address': data['address'],
                'phone': data['phone'],
                'email': data['email'],
                'currency': data['currency'],
                'items': items,
                'taxes': data['taxes'],
                'subtotal': float(data['subtotal']),
                'totalTaxes': float(data['totalTaxes']),
                'grandTotal': float(data['grandTotal']),
                'status': data['status'],
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            result = purchase_receipts_collection.insert_one(receipt)
            inserted_receipt = purchase_receipts_collection.find_one({'_id': result.inserted_id})
            if data['status'] == 'Submitted':
                for item in items:
                    item_obj = purchase_items_collection.find_one({'_id': item['itemId']})
                    add_master = 0
                    add_outer = 0
                    add_nos = 0
                    if item['unit'] == 'master':
                        add_master = item['acceptedQuantity']
                    elif item['unit'] == 'outer':
                        add_outer = item['acceptedQuantity']
                    elif item['unit'] == 'nos':
                        add_nos = item['acceptedQuantity']
                    total_added_in_nos = (add_master * item_obj['masterToOuter'] * item_obj['outerToNos']) + (add_outer * item_obj['outerToNos']) + add_nos
                    purchase_items_collection.update_one(
                        {'_id': item['itemId']},
                        {'$inc': {
                            'stockMaster': add_master,
                            'stockOuter': add_outer,
                            'stockNos': add_nos,
                            'totalStock': total_added_in_nos,
                            'totalPurchased': total_added_in_nos
                        }}
                    )
            return jsonify(convert_objectid_to_str(inserted_receipt)), 201
        except ValueError as e:
            return jsonify({'error': f"Invalid data format: {str(e)}"}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to create purchase receipt: {str(e)}"}), 500
    @app.route('/api/purchase_receipts/<series>', methods=['PUT'])
    @db_required
    def update_purchase_receipt(series):
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No input data provided'}), 400
            old_receipt = purchase_receipts_collection.find_one({'series': series})
            if not old_receipt:
                return jsonify({'error': 'Purchase Receipt not found'}), 404
            was_submitted = old_receipt['status'] == 'Submitted'
            new_status = data.get('status', old_receipt['status'])
            if was_submitted and new_status == 'Submitted':
                pass
            elif was_submitted and new_status != 'Submitted':
                for item in old_receipt['items']:
                    item_obj = purchase_items_collection.find_one({'_id': item['itemId']})
                    sub_master = 0
                    sub_outer = 0
                    sub_nos = 0
                    if item['unit'] == 'master':
                        sub_master = item['acceptedQuantity']
                    elif item['unit'] == 'outer':
                        sub_outer = item['acceptedQuantity']
                    elif item['unit'] == 'nos':
                        sub_nos = item['acceptedQuantity']
                    total_sub_in_nos = (sub_master * item_obj['masterToOuter'] * item_obj['outerToNos']) + (sub_outer * item_obj['outerToNos']) + sub_nos
                    purchase_items_collection.update_one(
                        {'_id': item['itemId']},
                        {'$inc': {
                            'stockMaster': -sub_master,
                            'stockOuter': -sub_outer,
                            'stockNos': -sub_nos,
                            'totalStock': -total_sub_in_nos,
                            'totalPurchased': -total_sub_in_nos
                        }}
                    )
            elif not was_submitted and new_status == 'Submitted':
                items = data.get('items', old_receipt['items'])
                for item in items:
                    item_obj = purchase_items_collection.find_one({'_id': item['itemId']})
                    add_master = 0
                    add_outer = 0
                    add_nos = 0
                    if item['unit'] == 'master':
                        add_master = item['acceptedQuantity']
                    elif item['unit'] == 'outer':
                        add_outer = item['acceptedQuantity']
                    elif item['unit'] == 'nos':
                        add_nos = item['acceptedQuantity']
                    total_added_in_nos = (add_master * item_obj['masterToOuter'] * item_obj['outerToNos']) + (add_outer * item_obj['outerToNos']) + add_nos
                    purchase_items_collection.update_one(
                        {'_id': item['itemId']},
                        {'$inc': {
                            'stockMaster': add_master,
                            'stockOuter': add_outer,
                            'stockNos': add_nos,
                            'totalStock': total_added_in_nos,
                            'totalPurchased': total_added_in_nos
                        }}
                    )
            update_fields = {}
            for field in ['date', 'poId', 'company', 'supplierId', 'name', 'supplierCompany', 'address', 'phone', 'email', 'currency', 'items', 'taxes', 'subtotal', 'totalTaxes', 'grandTotal', 'status']:
                if field in data:
                    if field == 'date':
                        update_fields[field] = datetime.fromisoformat(str(data[field]).replace('Z', '+00:00'))
                    elif field in ['subtotal', 'totalTaxes', 'grandTotal']:
                        update_fields[field] = float(data[field])
                    elif field == 'items':
                        items = []
                        for item_data in data[field]:
                            items.append({
                                'itemId': item_data['itemId'],
                                'originalQuantity': float(item_data['originalQuantity']),
                                'acceptedQuantity': float(item_data['acceptedQuantity']),
                                'rejectedQuantity': float(item_data['rejectedQuantity']),
                                'rate': float(item_data.get('rate', 0)),
                                'amount': float(item_data.get('amount', 0)),
                                'unit': item_data['unit']
                            })
                        update_fields[field] = items
                    else:
                        update_fields[field] = data[field]
            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400
            result = purchase_receipts_collection.update_one({'series': series}, {'$set': update_fields})
            if result.matched_count == 0:
                return jsonify({'error': 'Purchase Receipt not found'}), 404
            return jsonify({'message': 'Purchase Receipt updated successfully'}), 200
        except ValueError as e:
            return jsonify({'error': f"Invalid data format: {str(e)}"}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to update purchase receipt: {str(e)}"}), 500
    @app.route('/api/purchase_receipts/<series>', methods=['DELETE'])
    @db_required
    def delete_purchase_receipt(series):
        try:
            old_receipt = purchase_receipts_collection.find_one({'series': series})
            if not old_receipt:
                return jsonify({'error': 'Purchase Receipt not found'}), 404
            if old_receipt['status'] == 'Submitted':
                for item in old_receipt['items']:
                    item_obj = purchase_items_collection.find_one({'_id': item['itemId']})
                    sub_master = 0
                    sub_outer = 0
                    sub_nos = 0
                    if item['unit'] == 'master':
                        sub_master = item['acceptedQuantity']
                    elif item['unit'] == 'outer':
                        sub_outer = item['acceptedQuantity']
                    elif item['unit'] == 'nos':
                        sub_nos = item['acceptedQuantity']
                    total_sub_in_nos = (sub_master * item_obj['masterToOuter'] * item_obj['outerToNos']) + (sub_outer * item_obj['outerToNos']) + sub_nos
                    purchase_items_collection.update_one(
                        {'_id': item['itemId']},
                        {'$inc': {
                            'stockMaster': -sub_master,
                            'stockOuter': -sub_outer,
                            'stockNos': -sub_nos,
                            'totalStock': -total_sub_in_nos,
                            'totalPurchased': -total_sub_in_nos
                        }}
                    )
            result = purchase_receipts_collection.delete_one({'series': series})
            if result.deleted_count == 0:
                return jsonify({'error': 'Purchase Receipt not found'}), 404
            return jsonify({'message': 'Purchase Receipt deleted successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Failed to delete purchase receipt: {str(e)}"}), 500
    @app.route('/api/purchase_invoices', methods=['GET'])
    @db_required
    def get_purchase_invoices():
        try:
            invoices = purchase_invoices_collection.find()
            return jsonify(convert_objectid_to_str(invoices)), 200
        except Exception as e:
            return jsonify({'error': f"Failed to fetch purchase invoices: {str(e)}"}), 500
    @app.route('/api/purchase_invoices', methods=['POST'])
    @db_required
    def add_purchase_invoice():
        try:
            data = request.json
            required_fields = ['series', 'date', 'company', 'supplierId', 'name', 'supplierCompany', 'address', 'phone', 'email', 'poId', 'prId', 'currency', 'items', 'taxes', 'totalQuantity', 'subtotal', 'taxesAdded', 'grandTotal', 'status']
            if not all(key in data for key in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
            if purchase_invoices_collection.find_one({'series': data['series'] }):
                return jsonify({'error': 'Series already exists'}), 400
            pr = purchase_receipts_collection.find_one({'series': data['prId']})
            if not pr:
                return jsonify({'error': 'Purchase Receipt not found'}), 404
            items = []
            for item_data in data['items']:
                item_doc = purchase_items_collection.find_one({'_id': item_data['itemId']})
                if not item_doc:
                    return jsonify({'error': f"Item {item_data['itemId']} not found"}), 404
                items.append({
                    'itemId': item_data['itemId'],
                    'acceptedQuantity': float(item_data['acceptedQuantity']),
                    'rate': float(item_data.get('rate', 0)),
                    'amount': float(item_data.get('amount', 0)),
                    'unit': item_data['unit']
                })
            invoice = {
                'series': data['series'],
                'date': datetime.fromisoformat(str(data['date']).replace('Z', '+00:00')),
                'company': data['company'],
                'supplierId': data['supplierId'],
                'name': data['name'],
                'supplierCompany': data['supplierCompany'],
                'address': data['address'],
                'phone': data['phone'],
                'email': data['email'],
                'poId': data['poId'],
                'prId': data['prId'],
                'currency': data['currency'],
                'items': items,
                'taxes': data['taxes'],
                'totalQuantity': float(data['totalQuantity']),
                'subtotal': float(data['subtotal']),
                'taxesAdded': float(data['taxesAdded']),
                'grandTotal': float(data['grandTotal']),
                'status': data['status'],
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            result = purchase_invoices_collection.insert_one(invoice)
            inserted_invoice = purchase_invoices_collection.find_one({'_id': result.inserted_id})
            if data['status'] == 'Submitted':
                suppliers_collection.update_one(
                    {'_id': data['supplierId']},
                    {'$set': {
                        'lastPurchaseDate': invoice['date'],
                        'lastPurchaseValue': invoice['grandTotal']
                    }}
                )
            return jsonify(convert_objectid_to_str(inserted_invoice)), 201
        except ValueError as e:
            return jsonify({'error': f"Invalid data format: {str(e)}"}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to create purchase invoice: {str(e)}"}), 500
    @app.route('/api/purchase_invoices/<series>', methods=['PUT'])
    @db_required
    def update_purchase_invoice(series):
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No input data provided'}), 400
            old_invoice = purchase_invoices_collection.find_one({'series': series})
            if not old_invoice:
                return jsonify({'error': 'Purchase Invoice not found'}), 404
            update_fields = {}
            for field in ['date', 'company', 'supplierId', 'name', 'supplierCompany', 'address', 'phone', 'email', 'poId', 'prId', 'currency', 'items', 'taxes', 'totalQuantity', 'subtotal', 'taxesAdded', 'grandTotal', 'status']:
                if field in data:
                    if field == 'date':
                        update_fields[field] = datetime.fromisoformat(str(data[field]).replace('Z', '+00:00'))
                    elif field in ['totalQuantity', 'subtotal', 'taxesAdded', 'grandTotal']:
                        update_fields[field] = float(data[field])
                    elif field == 'items':
                        items = []
                        for item_data in data[field]:
                            items.append({
                                'itemId': item_data['itemId'],
                                'acceptedQuantity': float(item_data['acceptedQuantity']),
                                'rate': float(item_data.get('rate', 0)),
                                'amount': float(item_data.get('amount', 0)),
                                'unit': item_data['unit']
                            })
                        update_fields[field] = items
                    else:
                        update_fields[field] = data[field]
            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400
            result = purchase_invoices_collection.update_one({'series': series}, {'$set': update_fields})
            if result.matched_count == 0:
                return jsonify({'error': 'Purchase Invoice not found'}), 404
            new_status = data.get('status', old_invoice['status'])
            supplier_id = data.get('supplierId', old_invoice.get('supplierId'))
            if new_status == 'Submitted' and supplier_id:
                suppliers_collection.update_one(
                    {'_id': supplier_id},
                    {'$set': {
                        'lastPurchaseDate': data.get('date', old_invoice['date']),
                        'lastPurchaseValue': float(data.get('grandTotal', old_invoice['grandTotal']))
                    }}
                )
            return jsonify({'message': 'Purchase Invoice updated successfully'}), 200
        except ValueError as e:
            return jsonify({'error': f"Invalid data format: {str(e)}"}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to update purchase invoice: {str(e)}"}), 500
    @app.route('/api/purchase_invoices/<series>', methods=['DELETE'])
    @db_required
    def delete_purchase_invoice(series):
        try:
            result = purchase_invoices_collection.delete_one({'series': series})
            if result.deleted_count == 0:
                return jsonify({'error': 'Purchase Invoice not found'}), 404
            return jsonify({'message': 'Purchase Invoice deleted successfully'}), 200
        except Exception as e:
            return jsonify({'error': f"Failed to delete purchase invoice: {str(e)}"}), 500
    @app.route('/api/purchase_sales', methods=['GET'])
    @db_required
    def get_purchase_sales():
        try:
            sales = purchase_sales_collection.find()
            return jsonify(convert_objectid_to_str(sales)), 200
        except Exception as e:
            return jsonify({'error': f"Failed to fetch sales: {str(e)}"}), 500
    @app.route('/api/purchase_sales', methods=['POST'])
    @db_required
    def add_purchase_sale():
        try:
            data = request.json
            required_fields = ['itemId', 'quantity']
            if not all(key in data for key in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
            item = purchase_items_collection.find_one({'_id': data['itemId']})
            if not item:
                return jsonify({'error': 'Item not found'}), 404
            quantity = float(data['quantity'])
            if quantity > item['totalStock']:
                return jsonify({'error': 'Insufficient stock'}), 400
            sale = {
                'itemId': data['itemId'],
                'quantity': quantity,
                'date': datetime.now(timezone.utc).isoformat(),
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            result = purchase_sales_collection.insert_one(sale)
            purchase_items_collection.update_one(
                {'_id': data['itemId']},
                {'$inc': {
                    'soldNos': quantity,
                    'totalStock': -quantity
                }}
            )
            inserted_sale = purchase_sales_collection.find_one({'_id': result.inserted_id})
            return jsonify(convert_objectid_to_str(inserted_sale)), 201
        except ValueError as e:
            return jsonify({'error': f"Invalid data format: {str(e)}"}), 400
        except Exception as e:
            return jsonify({'error': f"Failed to record sale: {str(e)}"}), 500
    @app.route('/api/print_settings/active', methods=['GET'])
    @db_required
    def get_active_print_settings():
        try:
            setting = print_settings_collection.find_one({"active": True})
            if not setting:
                return jsonify({"error": "No active print setting found"}), 404
            return jsonify(convert_objectid_to_str(setting)), 200
        except Exception as e:
            logger.error(f"Error fetching active print setting: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500
    @app.route('/api/print_settings/deactivate_all', methods=['PUT'])
    @db_required
    def deactivate_all_print_settings():
        try:
            print_settings_collection.update_many({}, {"$set": {"active": False}})
            return jsonify({"message": "All print settings deactivated successfully"})
        except Exception as e:
            logger.error(f"Error deactivating print settings: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500
    @app.route('/api/print_settings/<id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @db_required
    def print_setting(id):
        if request.method == 'OPTIONS':
            response = jsonify({"success": True})
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            return response, 200
        if request.method == 'GET':
            setting = print_settings_collection.find_one({"_id": id})
            if not setting:
                return jsonify({"error": "Setting not found"}), 404
            return jsonify(convert_objectid_to_str(setting)), 200
        if request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
            update_data = {k: v for k, v in data.items() if k != '_id' and k != 'active'}
            result = print_settings_collection.update_one({"_id": id}, {"$set": update_data})
            if result.matched_count == 0:
                return jsonify({"error": "Setting not found"}), 404
            return jsonify({"message": "Print settings updated successfully"}), 200
        if request.method == 'DELETE':
            result = print_settings_collection.delete_one({"_id": id})
            if result.deleted_count == 0:
                return jsonify({"error": "Setting not found"}), 404
            return jsonify({"message": "Print settings deleted successfully"}), 200
    @app.route('/api/print_settings/set_active/<id>', methods=['PUT'])
    @db_required
    def set_active_print_settings(id):
        try:
            print_settings_collection.update_many({}, {"$set": {"active": False}})
            result = print_settings_collection.update_one({"_id": id}, {"$set": {"active": True}})
            if result.matched_count == 0:
                return jsonify({"error": "Setting not found"}), 404
            return jsonify({"message": "Active print settings set successfully"}), 200
        except Exception as e:
            logger.error(f"Error setting active print settings: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500
    @app.route('/api/combo-offer', methods=['GET'])
    @db_required
    def get_combo_offers():
        try:
            offers = combo_offers_collection.find()
            current_time = datetime.now(ZoneInfo("UTC"))
            offers_list = []
            for offer in offers:
                if 'offer_end_time' in offer and offer['offer_end_time']:
                    try:
                        end_time = datetime.fromisoformat(str(offer['offer_end_time']).replace('Z', '+00:00'))
                        if current_time > end_time:
                            combo_offers_collection.delete_one({'_id': offer['_id']})
                            logger.info(f"Deleted expired combo offer: {offer['_id']}")
                            continue
                    except (ValueError, TypeError) as e:
                        logger.error(f"Invalid offer end time format in offer {offer['_id']}: {str(e)}")
                offer_str = convert_objectid_to_str(offer)
                offers_list.append(offer_str)
            logger.info(f"Fetched {len(offers_list)} combo offers")
            return jsonify(offers_list), 200
        except Exception as e:
            logger.error(f"Error fetching combo offers: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/combo-offer/<offer_id>', methods=['GET'])
    @db_required
    def get_combo_offer(offer_id):
        try:
            offer = combo_offers_collection.find_one({'_id': offer_id})
            if not offer:
                logger.warning(f"Combo offer not found: {offer_id}")
                return jsonify({"error": "Combo offer not found"}), 404
            current_time = datetime.now(ZoneInfo("UTC"))
            if 'offer_end_time' in offer and offer['offer_end_time']:
                try:
                    end_time = datetime.fromisoformat(str(offer['offer_end_time']).replace('Z', '+00:00'))
                    if current_time > end_time:
                        combo_offers_collection.delete_one({'_id': offer['_id']})
                        logger.info(f"Deleted expired combo offer: {offer_id}")
                        return jsonify({"error": "Combo offer not found"}), 404
                except (ValueError, TypeError) as e:
                    logger.error(f"Invalid offer end time format in offer {offer_id}: {str(e)}")
            offer = convert_objectid_to_str(offer)
            logger.info(f"Fetched combo offer: {offer_id}")
            return jsonify(offer), 200
        except Exception as e:
            logger.error(f"Error fetching combo offer {offer_id}: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/combo-offer', methods=['POST'])
    @db_required
    def create_combo_offer():
        try:
            data = request.json
            if not data:
                logger.error("No data provided for combo offer creation")
                return jsonify({"error": "No data provided"}), 400
            required_fields = ['description', 'total_price', 'items']
            for field in required_fields:
                if field not in data:
                    logger.error(f"Missing required field: {field}")
                    return jsonify({"error": f"Missing required field: {field}"}), 400
                value = data[field]
                if field == 'description':
                    if not isinstance(value, str) or not value.strip():
                        logger.error(f"Empty or invalid string field: {field}")
                        return jsonify({"error": f"Field '{field}' must be a non-empty string"}), 400
                elif field == 'total_price':
                    if not isinstance(value, (int, float)) or value < 0:
                        logger.error(f"Invalid total_price: {value}")
                        return jsonify({"error": "Field 'total_price' must be a non-negative number"}), 400
                elif field == 'items':
                    if not isinstance(value, list) or not value:
                        logger.error(f"Empty or invalid items list")
                        return jsonify({"error": "Field 'items' must be a non-empty list"}), 400
            if 'offer_price' in data:
                value = data['offer_price']
                if not isinstance(value, (int, float)) or value < 0:
                    logger.error(f"Invalid offer_price: {value}")
                    return jsonify({"error": "Field 'offer_price' must be a non-negative number"}), 400
            if 'offer_start_time' in data and data['offer_start_time'] and 'offer_end_time' in data and data['offer_end_time']:
                try:
                    offer_start_time = datetime.fromisoformat(str(data['offer_start_time']).replace('Z', '+00:00'))
                    offer_end_time = datetime.fromisoformat(str(data['offer_end_time']).replace('Z', '+00:00'))
                    if offer_start_time >= offer_end_time:
                        logger.error("offer_start_time must be before offer_end_time")
                        return jsonify({"error": "Offer start time must be before offer end time"}), 400
                except (ValueError, TypeError) as e:
                    logger.error(f"Invalid offer time format: {str(e)}")
                    return jsonify({"error": f"Invalid offer time format: {str(e)}"}), 400
            data['created_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
            offer_id = combo_offers_collection.insert_one(data).inserted_id
            logger.info(f"Combo offer created with ID: {offer_id}")
            return jsonify({'message': 'Combo offer created successfully!', 'id': offer_id}), 201
        except Exception as e:
            logger.error(f"Error creating combo offer: {str(e)}\n{traceback.format_exc()}")
            return jsonify({'error': str(e)}), 500
    @app.route('/api/combo-offer/<offer_id>', methods=['PUT'])
    @db_required
    def update_combo_offer(offer_id):
        try:
            data = request.json
            if not data:
                logger.error("No data provided for combo offer update")
                return jsonify({"error": "No data provided"}), 400
            if '_id' in data:
                del data['_id']
            for field in data:
                value = data[field]
                if field in ['total_price', 'offer_price']:
                    if not isinstance(value, (int, float)) or value < 0:
                        logger.error(f"Invalid {field}: {value}")
                        return jsonify({"error": f"Field '{field}' must be a non-negative number"}), 400
                if field == 'description':
                    if not isinstance(value, str) or not value.strip():
                        logger.error(f"Empty or invalid string field: {field}")
                        return jsonify({"error": f"Field '{field}' must be a non-empty string"}), 400
                if field == 'items':
                    if not isinstance(value, list) or not value:
                        logger.error(f"Empty or invalid items list")
                        return jsonify({"error": "Field 'items' must be a non-empty list"}), 400
            if 'offer_start_time' in data and data['offer_start_time'] and 'offer_end_time' in data and data['offer_end_time']:
                try:
                    offer_start_time = datetime.fromisoformat(str(data['offer_start_time']).replace('Z', '+00:00'))
                    offer_end_time = datetime.fromisoformat(str(data['offer_end_time']).replace('Z', '+00:00'))
                    if offer_start_time >= offer_end_time:
                        logger.error("offer_start_time must be before offer_end_time")
                        return jsonify({"error": "Offer start time must be before offer end time"}), 400
                except (ValueError, TypeError) as e:
                    logger.error(f"Invalid offer time format: {str(e)}")
                    return jsonify({"error": f"Invalid offer time format: {str(e)}"}), 400
            data['modified_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
            result = combo_offers_collection.update_one({'_id': offer_id}, {'$set': data})
            if result.matched_count == 0:
                logger.warning(f"Combo offer not found for update: {offer_id}")
                return jsonify({"error": "Combo offer not found"}), 404
            logger.info(f"Combo offer updated: {offer_id}")
            return jsonify({"message": "Combo offer updated successfully"}), 200
        except Exception as e:
            logger.error(f"Error updating combo offer {offer_id}: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/combo-offer/<offer_id>', methods=['DELETE'])
    @db_required
    def delete_combo_offer(offer_id):
        try:
            result = combo_offers_collection.delete_one({'_id': offer_id})
            if result.deleted_count == 0:
                logger.warning(f"Combo offer not found for deletion: {offer_id}")
                return jsonify({"error": "Combo offer not found"}), 404
            logger.info(f"Combo offer deleted: {offer_id}")
            return jsonify({"message": "Combo offer deleted successfully"}), 200
        except Exception as e:
            logger.error(f"Error deleting combo offer {offer_id}: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": str(e)}), 500
    @app.route('/api/save-vat', methods=['POST'])
    @db_required
    def save_vat():
        try:
            data = request.get_json()
            vat = data.get('vat')
            if vat is None:
                return jsonify({"error": "VAT amount required"}), 400
            try:
                vat = float(vat)
            except:
                return jsonify({"error": "Invalid VAT amount"}), 400
            vat_collection.replace_one({"_id": "vat_settings"}, {"_id": "vat_settings", "vat": vat}, upsert=True)
            return jsonify({"message": "VAT saved successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    @app.route('/api/get-vat', methods=['GET'])
    @db_required
    def get_vat():
        try:
            settings = vat_collection.find_one({"_id": "vat_settings"})
            vat = settings.get("vat", 10) if settings else 10
            return jsonify({"vat": vat}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
def get_all_print_settings():
    try:
        settings = print_settings_collection.find()
        return jsonify(convert_objectid_to_str(settings)), 200
    except Exception as e:
        logger.error(f"Error fetching print settings: {str(e)}")
        return jsonify({"error": str(e)}), 500
def create_print_settings():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        data['active'] = data.get('active', False)
        data['created_at'] = datetime.now(ZoneInfo("UTC")).isoformat()
        result = print_settings_collection.insert_one(data)
        if not print_settings_collection.find_one({"_id": {"$ne": result.inserted_id}, "active": True}):
            print_settings_collection.update_many({"_id": {"$ne": result.inserted_id}}, {"$set": {"active": False}})
        logger.info(f"Print settings created with ID: {result.inserted_id}")
        return jsonify({"message": "Print settings created successfully", "id": result.inserted_id}), 201
    except Exception as e:
        logger.error(f"Error creating print settings: {str(e)}")
        return jsonify({"error": str(e)}), 500
def manage_offers():
    """Check all items and update offer status based on current time."""
    try:
        current_time = datetime.now(ZoneInfo("UTC"))
        items = items_collection.find()
        for item in items:
            item_id = item['_id']
            offer_start_time = item.get('offer_start_time')
            offer_end_time = item.get('offer_end_time')
            should_unset = False
            if offer_start_time and offer_end_time:
                try:
                    start_time = datetime.fromisoformat(str(offer_start_time).replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(str(offer_end_time).replace('Z', '+00:00'))
                    if current_time > end_time:
                        should_unset = True
                        logger.info(f"Offer expired for item {item.get('item_name')} (ID: {item_id})")
                    elif start_time > end_time:
                        should_unset = True
                        logger.warning(f"Invalid offer times for item {item_id}: start after end")
                    else:
                        logger.debug(f"Offer for item {item.get('item_name')} (ID: {item_id}) is active or pending")
                except (ValueError, TypeError) as e:
                    logger.warning(f"Invalid offer time format for item {item_id}: {str(e)}")
                    should_unset = True
            elif offer_end_time:
                try:
                    end_time = datetime.fromisoformat(str(offer_end_time).replace('Z', '+00:00'))
                    if current_time > end_time:
                        should_unset = True
                        logger.info(f"Offer expired for item {item.get('item_name')} (ID: {item_id})")
                except (ValueError, TypeError) as e:
                    logger.warning(f"Invalid offer_end_time for item {item_id}: {str(e)}")
                    should_unset = True
            if should_unset:
                items_collection.update_one(
                    {'_id': item_id},
                    {'$unset': {'offer_price': "", 'offer_start_time': "", 'offer_end_time': ""}}
                )
                logger.info(f"Unset offer fields for item {item.get('item_name')} (ID: {item_id})")
    except Exception as e:
        logger.error(f"Error in manage_offers: {str(e)}")
def manage_combo_offers():
    """Check all combo offers and delete them when end time is reached."""
    try:
        current_time = datetime.now(ZoneInfo("UTC"))
        offers = combo_offers_collection.find()
        for offer in offers:
            offer_id = offer['_id']
            offer_end_time = offer.get('offer_end_time')
            if offer_end_time:
                try:
                    end_time = datetime.fromisoformat(str(offer_end_time).replace('Z', '+00:00'))
                    if current_time > end_time:
                        combo_offers_collection.delete_one({'_id': offer_id})
                        logger.info(f"Deleted expired combo offer: {offer_id}")
                except (ValueError, TypeError) as e:
                    logger.warning(f"Invalid offer_end_time for combo offer {offer_id}: {str(e)}")
    except Exception as e:
        logger.error(f"Error in manage_combo_offers: {str(e)}")
def schedule_tasks():
    if schedule:
        schedule.every(1).minutes.do(manage_offers)
        schedule.every(1).minutes.do(manage_combo_offers)
        while True:
            schedule.run_pending()
            time.sleep(1)
def start_scheduler():
    scheduler_thread = threading.Thread(target=schedule_tasks, daemon=True)
    scheduler_thread.start()
    logger.info("Automatic backup, offer, and combo offer scheduler started")
    # Schedule backup with initial interval
    settings = get_system_settings()
    interval = settings.get('backup_interval_hours', 6)
    if schedule:
        schedule.every(interval).hours.do(create_backup).tag('backup')
        logger.info(f"Scheduled automatic backups every {interval} hours")

@app.route('/api/company-details', methods=['POST', 'GET', 'OPTIONS'])
@db_required
def manage_company_details():
    if request.method == 'OPTIONS':
        response = jsonify({"success": True})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response, 200
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                logger.error("No data provided in POST request")
                return jsonify({"error": "No data provided"}), 400
            company_data = {
                '_id': str(uuid.uuid4()),
                'restaurantName': data.get('restaurantName', ''),
                'ownerName': data.get('ownerName', ''),
                'businessType': data.get('businessType', ''),
                'otherBusinessType': data.get('otherBusinessType', ''),
                'gstNumber': data.get('gstNumber', ''),
                'fssaiNumber': data.get('fssaiNumber', ''),
                'panNumber': data.get('panNumber', ''),
                'addresses': data.get('addresses', [{'addressLine1': '', 'addressLine2': '', 'city': '', 'state': '', 'pincode': '', 'country': ''}]),
                'contacts': data.get('contacts', [{'phoneNumber': '', 'whatsappNumber': '', 'emailAddress': '', 'website': ''}]),
                'bankName': data.get('bankName', ''),
                'accountHolderName': data.get('accountHolderName', ''),
                'accountNumber': data.get('accountNumber', ''),
                'ifscCode': data.get('ifscCode', ''),
                'upiId': data.get('upiId', ''),
                'currencyType': data.get('currencyType', ''),
                'created_at': datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()
            }
            logger.info(f"Saving company details: {company_data}")
            result = company_details_collection.insert_one(company_data)
            logger.info(f"Company details saved with ID: {result.inserted_id}")
            # Return the full saved data
            return jsonify({
                "message": "Company details saved successfully",
                "id": result.inserted_id,
                "companyDetails": company_data
            }), 201
        except Exception as e:
            logger.error(f"Error saving company details: {str(e)}")
            return jsonify({"error": f"Failed to save company details: {str(e)}"}), 500
    
    if request.method == 'GET':
        try:
            details = list(company_details_collection.find())
            # Convert MongoDB documents to JSON-serializable format
            serialized_details = []
            for detail in details:
                detail['_id'] = str(detail['_id'])
                serialized_details.append(detail)
            logger.info(f"Retrieved company details: {serialized_details}")
            return jsonify({"companyDetails": serialized_details}), 200
        except Exception as e:
            logger.error(f"Error retrieving company details: {str(e)}")
            return jsonify({"error": f"Failed to retrieve company details: {str(e)}"}), 500
@app.route('/api/activeorders', methods=['POST'])
@db_required
def save_active_order():
    try:
        data = request.get_json()
        order_type = data.get('orderType', 'Dine In')
        order_no = generate_order_number(order_type)
        cart_items = data.get('cartItems', [])
        for item in cart_items:
            required_kitchens = set()
            if item.get('kitchen'):
                required_kitchens.add(item['kitchen'])
            for addon_name, qty in item.get('addonQuantities', {}).items():
                if qty > 0 and 'addonVariants' in item and addon_name in item['addonVariants']:
                    if item['addonVariants'][addon_name].get('kitchen'):
                        required_kitchens.add(item['addonVariants'][addon_name]['kitchen'])
            for combo_name, qty in item.get('comboQuantities', {}).items():
                if qty > 0 and 'comboVariants' in item and combo_name in item['comboVariants']:
                    if item['comboVariants'][combo_name].get('kitchen'):
                        required_kitchens.add(item['comboVariants'][combo_name]['kitchen'])
            item['requiredKitchens'] = list(required_kitchens)
            item['kitchenStatuses'] = {kitchen: 'Pending' for kitchen in required_kitchens}
            item['served'] = False  # Add served false per item
        active_order = {
            'orderId': str(uuid.uuid4()),
            'orderNo': order_no,
            'customerName': data.get('customerName', 'N/A'),
            'tableNumber': data.get('tableNumber', 'N/A'),
            'chairsBooked': data.get('chairsBooked', []),
            'phoneNumber': data.get('phoneNumber', ''),
            'deliveryAddress': data.get('deliveryAddress', {}),
            'whatsappNumber': data.get('whatsappNumber', ''),
            'email': data.get('email', ''),
            'cartItems': cart_items,
            'timestamp': data.get('timestamp', datetime.now(timezone.utc).isoformat()),
            'orderType': order_type,
            'status': 'Pending',
            'paid': False,  # Add paid false
            'created_at': datetime.now(timezone.utc),
            'deliveryPersonId': data.get('deliveryPersonId', ''),
            'deliveryPersonName': data.get('deliveryPersonName', ''),
            'pickedUpTime': data.get('pickedUpTime', None),
        }
        activeorders_collection.insert_one(active_order)
        kitchen_saved_collection.insert_one(active_order.copy())
        logger.info(f"Created order: {active_order['orderId']} with order number: {order_no}")
        return jsonify({'success': True, 'orderId': active_order['orderId'], 'orderNo': order_no}), 201
    except Exception as e:
        logger.error(f"Error saving active order: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/activeorders', methods=['GET'])
@db_required
def get_active_orders():
    try:
        orders = activeorders_collection.find()
        return jsonify(convert_objectid_to_str(list(orders))), 200
    except Exception as e:
        logger.error(f"Error fetching active orders: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/activeorders/<order_id>/items/<item_id>/mark-prepared', methods=['POST'])
@db_required
def mark_item_prepared_active(order_id, item_id):
    try:
        data = request.get_json()
        kitchen = data.get('kitchen')
        if not kitchen:
            return jsonify({'success': False, 'error': 'Kitchen not provided'}), 400
        for collection in [activeorders_collection, kitchen_saved_collection]:
            order = collection.find_one({'orderId': order_id})
            if not order:
                return jsonify({'success': False, 'error': 'Order not found'}), 404
            found = False
            for item in order['cartItems']:
                if item['id'] == item_id:
                    if 'kitchenStatuses' not in item:
                        item['kitchenStatuses'] = {}
                    if item['kitchenStatuses'].get(kitchen) in ['Prepared', 'PickedUp']:
                        return jsonify({'success': False, 'error': 'Kitchen already marked as prepared or picked up'}), 400
                    item['kitchenStatuses'][kitchen] = 'Prepared'
                    found = True
                    break
            if not found:
                return jsonify({'success': False, 'error': 'Item not found'}), 404
            collection.replace_one({'orderId': order_id}, order)
        logger.info(f"Marked item {item_id} in order {order_id} as Prepared for kitchen {kitchen}")
        return jsonify({'success': True, 'status': 'Prepared'}), 200
    except Exception as e:
        logger.error(f"Error in mark-prepared: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
        
@app.route('/api/activeorders/<order_id>/items/<item_id>/mark-pickedup', methods=['POST'])
@db_required
def mark_item_pickedup_active(order_id, item_id):
    try:
        data = request.get_json()
        kitchen = data.get('kitchen')
        if not kitchen:
            return jsonify({'success': False, 'error': 'Kitchen not provided'}), 400
        for collection in [activeorders_collection, kitchen_saved_collection]:
            order = collection.find_one({'orderId': order_id})
            if not order:
                return jsonify({'success': False, 'error': 'Order not found'}), 404
            found = False
            for item in order['cartItems']:
                if item['id'] == item_id:
                    if 'kitchenStatuses' not in item:
                        item['kitchenStatuses'] = {}
                    status = item['kitchenStatuses'].get(kitchen)
                    if status == 'Pending':
                        logger.warning(f"Item {item_id} in order {order_id} was Pending, setting to Prepared automatically for kitchen {kitchen}")
                        item['kitchenStatuses'][kitchen] = 'Prepared'
                    elif status != 'Prepared':
                        return jsonify({'success': False, 'error': 'Item must be prepared before picking up'}), 400
                    item['kitchenStatuses'][kitchen] = 'PickedUp'
                    found = True
                    break
            if not found:
                return jsonify({'success': False, 'error': 'Item not found'}), 404
            collection.replace_one({'orderId': order_id}, order)
        order = activeorders_collection.find_one({'orderId': order_id})  # Reload to get updated
        picked_up_data = {
            'customerName': order.get('customerName', 'Unknown'),
            'tableNumber': order.get('tableNumber', 'N/A'),
            'items': order.get('cartItems', []),
            'pickupTime': datetime.now(timezone.utc).isoformat(),
            'orderType': order.get('orderType', 'Dine In')
        }
        picked_up_collection.insert_one(picked_up_data)
        logger.info(f"Marked item {item_id} in order {order_id} as PickedUp for kitchen {kitchen}")
        return jsonify({'success': True, 'status': 'PickedUp'}), 200
    except Exception as e:
        logger.error(f"Error in mark-pickedup: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/activeorders/<order_id>/items/<item_id>/mark-served', methods=['POST'])
@db_required
def mark_item_served(order_id, item_id):
    try:
        data = request.get_json()
        served = data.get('served', True)
        if served is None:
            return jsonify({'success': False, 'error': 'Served status not provided'}), 400
        for collection in [activeorders_collection, kitchen_saved_collection]:
            order = collection.find_one({'orderId': order_id})
            if not order:
                return jsonify({'success': False, 'error': 'Order not found'}), 404
            found = False
            for item in order['cartItems']:
                if item['id'] == item_id:
                    if not all(s == 'PickedUp' for s in item['kitchenStatuses'].values()):
                        return jsonify({'success': False, 'error': 'Item must be picked up before serving'}), 400
                    item['served'] = bool(served)
                    found = True
                    break
            if not found:
                return jsonify({'success': False, 'error': 'Item not found'}), 404
            collection.replace_one({'orderId': order_id}, order)
        logger.info(f"Marked item {item_id} in order {order_id} as {'Served' if served else 'Unserved'}")
        return jsonify({'success': True, 'served': served}), 200
    except Exception as e:
        logger.error(f"Error in mark-served: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/activeorders/<order_id>/items/<item_id>', methods=['DELETE'])
@db_required
def delete_order_item(order_id, item_id):
    try:
        for collection in [activeorders_collection, kitchen_saved_collection]:
            order = collection.find_one({'orderId': order_id})
            if not order:
                return jsonify({'success': False, 'error': 'Order not found'}), 404
            order['cartItems'] = [i for i in order['cartItems'] if i['id'] != item_id]
            if not order['cartItems']:
                collection.delete_one({'orderId': order_id})
            else:
                collection.replace_one({'orderId': order_id}, order)
        logger.info(f"Deleted item {item_id} from order {order_id}")
        return jsonify({'success': True}), 200
    except Exception as e:
        logger.error(f"Error deleting item: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/activeorders/<order_id>', methods=['PUT'])
@db_required
def update_active_order(order_id):
    try:
        data = request.get_json()
        if '_id' in data:
            del data['_id']
        order_in_db = activeorders_collection.find_one({'orderId': order_id})
        if not order_in_db:
            logger.warning(f"Order not found for update: {order_id}")
            return jsonify({'error': 'Order not found'}), 404
        old_statuses_map = {
            item['id']: item.get('kitchenStatuses', {})
            for item in order_in_db.get('cartItems', []) if 'id' in item
        }
        if 'cartItems' in data:
            for item in data['cartItems']:
                required_kitchens = set()
                if item.get('kitchen'):
                    required_kitchens.add(item['kitchen'])
                for addon_name, qty in item.get('addonQuantities', {}).items():
                    if qty > 0 and 'addonVariants' in item and addon_name in item['addonVariants']:
                        if item['addonVariants'][addon_name].get('kitchen'):
                            required_kitchens.add(item['addonVariants'][addon_name]['kitchen'])
                for combo_name, qty in item.get('comboQuantities', {}).items():
                    if qty > 0 and 'comboVariants' in item and combo_name in item['comboVariants']:
                        if item['comboVariants'][combo_name].get('kitchen'):
                            required_kitchens.add(item['comboVariants'][combo_name]['kitchen'])
                item['requiredKitchens'] = list(required_kitchens)
                item_id = item.get('id')
                old_item_statuses = old_statuses_map.get(item_id, {})
                new_kitchen_statuses = {}
                for kitchen in required_kitchens:
                    if kitchen in old_item_statuses:
                        new_kitchen_statuses[kitchen] = old_item_statuses[kitchen]
                    else:
                        new_kitchen_statuses[kitchen] = 'Pending'
                item['kitchenStatuses'] = new_kitchen_statuses
                item['served'] = item.get('served', False)  # Ensure served
        updated_order = {**order_in_db, **data}
        if 'cartItems' in data:
            updated_order['cartItems'] = data['cartItems']
        if 'deliveryPersonId' in updated_order and updated_order['deliveryPersonId']:
            employee = employees_collection.find_one({'employeeId': updated_order['deliveryPersonId']})
            if not employee:
                logger.warning(f"Delivery person not found: {updated_order['deliveryPersonId']}")
                return jsonify({'error': 'Delivery person not found'}), 404
            trip_report = {
                'tripId': str(uuid.uuid4()),
                'orderId': updated_order['orderId'],
                'orderNo': updated_order['orderNo'],
                'customerName': updated_order.get('customerName', 'N/A'),
                'tableNumber': updated_order.get('tableNumber', 'N/A'),
                'chairsBooked': updated_order.get('chairsBooked', []),
                'phoneNumber': updated_order.get('phoneNumber', ''),
                'deliveryAddress': updated_order.get('deliveryAddress', {}),
                'whatsappNumber': updated_order.get('whatsappNumber', ''),
                'email': updated_order.get('email', ''),
                'cartItems': updated_order.get('cartItems', []),
                'timestamp': updated_order.get('timestamp', datetime.now(timezone.utc).isoformat()),
                'orderType': updated_order.get('orderType', 'Dine In'),
                'status': updated_order.get('status', 'Pending'),
                'deliveryPersonId': updated_order['deliveryPersonId'],
                'deliveryPersonName': updated_order.get('deliveryPersonName', employee.get('name', 'N/A')),
                'pickedUpTime': updated_order.get('pickedUpTime', None),
                'paymentMethods': updated_order.get('paymentMethods', []),
                'cardDetails': updated_order.get('cardDetails', ''),
                'upiDetails': updated_order.get('upiDetails', ''),
                'created_at': datetime.now(timezone.utc)
            }
            tripreports_collection.insert_one(trip_report)
            logger.info(f"Saved trip report for order {order_id} with delivery person {updated_order['deliveryPersonId']}")
            activeorders_collection.delete_one({'orderId': order_id})
            kitchen_saved_collection.delete_one({'orderId': order_id})
            logger.info(f"Deleted order {order_id} from active orders after delivery person assignment")
            return jsonify({'success': True, 'message': 'Delivery person assigned and order moved to trip reports', 'order': convert_objectid_to_str(updated_order)}), 200
        if updated_order.get('paid', False) and all(item.get('served', False) for item in updated_order.get('cartItems', [])) and updated_order.get('orderType') != 'Online Delivery':
            updated_order['status'] = 'Completed'
        result = activeorders_collection.replace_one({'orderId': order_id}, updated_order)
        kitchen_result = kitchen_saved_collection.replace_one({'orderId': order_id}, updated_order)
        updated_order = activeorders_collection.find_one({'orderId': order_id})
        if result.matched_count > 0 or kitchen_result.matched_count > 0:
            logger.info(f"Updated order: {order_id}")
            return jsonify({'success': True, 'message': 'Order updated', 'order': convert_objectid_to_str(updated_order)}), 200
        logger.info(f"No changes made to order: {order_id}")
        return jsonify({'success': True, 'message': 'No changes made', 'order': convert_objectid_to_str(updated_order)}), 200
    except Exception as e:
        logger.error(f"Error updating active order: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/activeorders/<order_id>', methods=['DELETE'])
@db_required
def delete_order(order_id):
    try:
        result = activeorders_collection.delete_one({'orderId': order_id})
        kitchen_result = kitchen_saved_collection.delete_one({'orderId': order_id})
        if result.deleted_count > 0 or kitchen_result.deleted_count > 0:
            logger.info(f"Deleted order: {order_id}")
            return jsonify({'success': True}), 200
        logger.warning(f"Order not found for deletion: {order_id}")
        return jsonify({'error': 'Order not found'}), 404
    except Exception as e:
        logger.error(f"Error deleting order: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# Catch-all for React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path.startswith('api/'):
        return jsonify({"error": "API route not found"}), 404
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        if os.path.exists(os.path.join(app.static_folder, 'index.html')):
            return send_from_directory(app.static_folder, 'index.html')
        else:
            return "<h1>Backend is running</h1><p>Frontend not found. Ensure the 'dist' folder contains the built React app.</p>", 404
if __name__ == '__main__':
    connect_to_sqlite()
    if conn and schedule:
        start_scheduler()
    logger.info(f"Serving static files from: {app.static_folder}")
    if getattr(sys, 'frozen', False):
        logger.info("Running as frozen executable, using Waitress")
        import waitress
        waitress.serve(app, host='0.0.0.0', port=8000, threads=8)
    else:
        app.run(host='0.0.0.0', port=8000, debug=True)