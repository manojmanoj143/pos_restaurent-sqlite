block_cipher = None
a = Analysis(
    ['app1.py'],
    pathex=['D:\Me\manoj\\pos_restaurent-sqlite'], # Adjust to your project path
    binaries=[],
    datas=[
        ('D:\Me\manoj\\pos_restaurent-sqlite\\dist', 'dist'),
        ('D:\Me\manoj\\pos_restaurent-sqlite\\static', 'static'),
        ('D:\Me\manoj\\pos_restaurent-sqlite\\config.json', '.'),
        ('sqlite-tools-win-x64-3500400/sqlite3.exe', '.')
    ],
    hiddenimports=[
        'flask',
        'werkzeug',
        'jinja2',
        'sqlite3',
        'bcrypt',
        'waitress',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=['tkinter', 'PyQt5', 'numpy'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='flask_server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    target_arch='x64',
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    name='flask_server_dist'
)