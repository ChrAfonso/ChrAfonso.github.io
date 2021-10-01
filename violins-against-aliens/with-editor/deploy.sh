#!/bin/bash

TARGET=$1
if [ "$TARGET" == "" ]; then
	TARGET=violins-against-aliens
fi

cp -r ./* /m/Projects/GameDev/ChrAfonso.github.io/$TARGET
