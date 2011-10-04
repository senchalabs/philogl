import json

def airlines():
  ans = []
  with open('airlines.csv', 'r') as fin:
    text = fin.read().split('\n')
    for i, line in enumerate(text):
      if i > 0:
        ans.append(line.replace('"', '').split(','))
  
  with open('airlines.json', 'w') as fout:
    fout.write(json.dumps(ans, encoding='latin-1'))

if __name__ == '__main__':
  airlines()


