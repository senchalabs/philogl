cd build/
rm PhiloGL.zip
python build.py > PhiloGL.js
java -jar compiler.jar --js PhiloGL.js --js_output_file PhiloGL.cls.js
cd ../
git archive --format zip --output ./build/PhiloGL.zip master 

