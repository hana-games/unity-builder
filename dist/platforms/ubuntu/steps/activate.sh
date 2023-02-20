#!/usr/bin/env bash

echo "Bypassing activation :)"
/opt/unity/Editor/Unity -batchmode -nographics -logfile /dev/stdout -manualLicenseFile /root/share/unity3d/Unity/Unity_lic.ulf -quit
