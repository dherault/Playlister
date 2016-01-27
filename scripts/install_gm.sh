#!/bin/sh

while true; do
    read -p "Do you wish to install GraphickMagick ?" yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "Please answer yes or no.";;
    esac
done

cd ~/
mkdir tempgm && cd tempgm
wget ftp://ftp.icm.edu.pl/pub/unix/graphics/GraphicsMagick/delegates/jpegsrc.v9a.tar.gz
wget ftp://ftp.icm.edu.pl/pub/unix/graphics/GraphicsMagick/delegates/libpng-1.6.9.tar.gz
wget ftp://ftp.icm.edu.pl/pub/unix/graphics/GraphicsMagick/GraphicsMagick-LATEST.tar.gz

tar -xvzf jpegsrc.v9a.tar.gz
tar -xvzf GraphicsMagick-LATEST.tar.gz
tar -xvzf libpng-1.6.9.tar.gz

cd jpegsrc.v9a/ && ./configure && make && sudo make install && cd ..
cd libpng-1.6.9./ && ./configure && make && sudo make install && cd ..
cd GraphicsMagick*/ && ./configure && make && sudo make install && cd ..

gm convert -list formats

cd .. && rm -R tempgm
echo "if JPEG and PNG not listed, try sudo ranlib /usr/local/lib/libjpeg.a && sudo ldconfig /usr/local/lib && gm convert -list formats"
echo "Installation complete."
