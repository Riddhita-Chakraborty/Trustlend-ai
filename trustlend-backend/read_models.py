with open('models.txt', 'r', encoding='utf-16-le', errors='ignore') as f:
    try:
        print(f.read())
    except:
        pass
with open('models.txt', 'r', encoding='utf-8', errors='ignore') as f:
    try:
        print(f.read())
    except:
        pass
