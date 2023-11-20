/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Alert,
  Button,
  Image,
  TouchableHighlight,
  Platform,
  PermissionsAndroid,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import {Camera, CameraType} from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import RNFS from 'react-native-fs';
import SignatureScreen, {SignatureViewRef} from 'react-native-signature-canvas';

interface CapturedImage {
  height: number;
  width: number;
  uri: string;
}

const App = (): JSX.Element => {
  const isDarkMode = useColorScheme() === 'dark';
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(
    null,
  );
  const [captured, setCaptured] = React.useState<CapturedImage | null>(null);
  const [pdfIsCreated, setPdfisCreated] = React.useState([]);
  const [, requestPermission] = Camera.useCameraPermissions();
  const [showCamera, setShowCamera] = React.useState(true);
  const cameraRef = React.useRef<Camera | null>(null);
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const signatureRef = React.useRef<SignatureViewRef>(null);
  const [signature, setSign] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      const {status} = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      requestExternalStoragePermission();
    })();
  }, [pdfIsCreated]);

  React.useEffect(() => {
    if (hasPermission === false) {
      // Camera permissions are not granted yet
      Alert.alert('Permission', 'We need your permission to show the camera.', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {text: 'OK', onPress: () => requestPermission()},
      ]);
    }
  }, [hasPermission]);

  React.useEffect(() => {
    console.log('captured', captured);
  }, [captured]);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo: CapturedImage = await cameraRef.current.takePictureAsync();
      if (photo) {
        setCaptured(photo);
        setShowCamera(false);
      }
      // You can now handle the captured image (e.g., display it or save it).
    }
  };

  const handleFacesDetected = ({faces}: {faces: any}) => {
    if (faces.length > 0) {
      takePicture();
    }
    console.log('faces', faces);
  };

  const requestExternalStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'This app needs access to your storage to save files.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Storage permission granted');
        const dirDocs = `${RNFS.ExternalStorageDirectoryPath}/documents/Documents`;
        readFilesFromDirectory(dirDocs);
      } else {
        console.log('Storage permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const createPDF = async () => {
    const timeOnlyDate = new Date();
    let options = {
      html: `
        <html>
          <head>
            <title>PDF Example</title>
          </head>
          <body>
            <h1>PDF Example</h1>
            <p>This is an example PDF document with an image:</p>
            <img src="${signature}" height="150" width="300" />
          </body>
        </html>
      `,
      fileName: `test2-${timeOnlyDate.getSeconds()}`,
      directory: 'Documents',
    };

    let file = await RNHTMLtoPDF.convert(options);
    // console.log(file.filePath);
    setPdfisCreated(file.filePath);
    Alert.alert(file.filePath);
  };

  const getDownloadDirectory = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/*',
        copyToCacheDirectory: false,
        multiple: false,
      });
      console.log('result', result);
      if (result.assets) {
        for (let file of result.assets) {
          console.log('File URI:', file.uri);
          console.log('File name:', file.name);
          console.log('File size:', file.size);
        }
      } else {
        console.log('No file selected or an error occurred.');
      }
    } catch (error) {
      console.error('Error getting the file:', error);
    }
  };

  const readFilesFromDirectory = async (dirDocs: string) => {
    try {
      const files = await RNFS.readDir(dirDocs);

      if (files.length > 0) {
        for (const file of files) {
          pdfFile(file);
        }
      }
    } catch (err) {
      const errorString = JSON.stringify(err);
      const erroObj = JSON.parse(errorString);
      // if the directory does not exist
      if (erroObj.message === 'Folder does not exist') {
        console.log(erroObj.message);
        await RNFS.mkdir(dirDocs);
      }
    }
  };

  const pdfFile = async (file: {
    ctime?: Date | undefined;
    mtime?: Date | undefined;
    name?: string;
    path: any;
    size?: number;
    isFile?: () => boolean;
    isDirectory?: () => boolean;
  }) => {
    console.log('file', file.name);
    //const pdf = await RNFS.readFile(file.path, 'base64');
    // console.log('pdf', pdf);
  };

  const handleClear = () => {
    console.log('clear success!');
  };

  const handleEnd = () => {
    console.log('end');
    signatureRef.current?.readSignature();
  };

  const handleSignature = (signature: React.SetStateAction<null>) => {
    console.log(signature);
    setSign(signature);
  };

  const handleEmpty = () => {
    console.log('Empty');
  };

  const style = `.m-signature-pad--footer
    .button {
      background-color: blue;
      color: #FFF;
    } 
    .m-signature-pad {
      height: 300px;
    }
    `;

  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
        contentContainerStyle={styles.scrollContainer}>
        {/* Start of  POC for Face Recognition */}
        {showCamera && (
          <Camera
            ref={cameraRef}
            onFacesDetected={handleFacesDetected}
            ratio="1:1"
            faceDetectorSettings={{
              mode: FaceDetector.FaceDetectorMode.fast,
              detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
              runClassifications: FaceDetector.FaceDetectorClassifications.none,
              minDetectionInterval: 1000,
              tracking: true,
            }}
            type={CameraType.front}
            style={{
              height: 500,
            }}
          />
        )}

        {captured && (
          <View style={styles.sectionContainer}>
            <Image
              source={{uri: captured.uri}}
              resizeMethod="resize"
              style={{width: 400, height: 300}}
            />
            <View
              style={{
                margin: 20,
              }}>
              <Button
                title="Take New Picture"
                onPress={() => {
                  setCaptured(null);
                  setShowCamera(true);
                }}
              />
            </View>
          </View>
        )}
        {/* End of  POC for Face Recognition */}

        {!showCamera && (
          <View style={styles.pdfContainer}>
            <TouchableHighlight
              onPress={createPDF}
              style={{
                marginBottom: 20,
              }}>
              <Text>Create PDF</Text>
            </TouchableHighlight>
            <TouchableHighlight onPress={getDownloadDirectory}>
              <Text>Open Created PDF</Text>
            </TouchableHighlight>

            {signature ? (
              <View style={styles.preview}>
                <Image
                  resizeMode={'contain'}
                  style={{width: 335, height: 114}}
                  source={{uri: signature}}
                />
              </View>
            ) : null}

            <SignatureScreen
              backgroundColor="#FFFFFF"
              ref={signatureRef}
              onEnd={handleEnd}
              onOK={handleSignature}
              onEmpty={handleEmpty}
              onClear={handleClear}
              autoClear={false}
              descriptionText="Sign"
              clearText="Clear"
              confirmText="Save"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    minHeight: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  sectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  pdfContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column-reverse',
    marginTop: 50,
  },
  preview: {
    width: 335,
    height: 114,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  previewText: {
    color: '#FFF',
    fontSize: 14,
    height: 40,
    lineHeight: 40,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: '#69B2FF',
    width: 120,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default App;
