import os

log_file = 'backend.log'

try:
    with open(log_file, 'r', encoding='utf-16-le') as f:
        lines = f.readlines()
        print("--- Last 50 lines ---")
        for line in lines[-50:]:
            print(line.strip())
except Exception as e:
    print(f"Failed with utf-16-le: {e}")
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            print("--- Last 50 lines (utf-8) ---")
            for line in lines[-50:]:
                print(line.strip())
    except Exception as e2:
        print(f"Failed with utf-8: {e2}")
        # Try binary
        with open(log_file, 'rb') as f:
            f.seek(0, 2)
            size = f.tell()
            f.seek(max(0, size - 2000))
            data = f.read()
            print("--- Last 2000 bytes (binary/decoded) ---")
            print(data.decode('utf-8', errors='ignore'))
