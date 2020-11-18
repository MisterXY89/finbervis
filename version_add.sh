#!/bin/bash

author="Tilman Kerl"
DIR="src/"
cd "$DIR"

# adds version & author to all py files
for file in *.py; do
    [ -f "$file" ] || break
    line=$(head -n 1 $file)
    date=$(date +"%Y.%m.%d")
    if [[ $line =~ "\"\"\"" ]]
    # if line starts with """ -> then remove version & author
    then
        sed -i '/@version/d' "$file"
        sed -i '/@author/d' "$file"
        sed -e "2i\@author: $author\n@version: $date" "$file" > "v.$file"
    else 
        sed -e "1i\\\"\"\"\n@author: $author\n@version: $date \n---\nDescription of $file\n\"\"\"\n" "$file" > "v.$file"        
    fi    
    # add author and correct version    
    rm "$file"
    mv "v.$file" "$file"
done
