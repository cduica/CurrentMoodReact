import React from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ListView,
  TouchableHighlight,
  Linking
} from 'react-native';
import Camera from 'react-native-camera';
var Config = require('./config.json');
var Clarifai = require('clarifai');
var SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId : Config.SPOTIFY_CLIENT_ID,
  clientSecret : Config.SPOTIFY_CLIENT_SECRET,
  redirectUri : 'http://www.example.com/callback'
});

// Retrieve an access token.
spotifyApi.clientCredentialsGrant()
.then(function(data) {
  console.log('The access token expires in ' + data.body['expires_in']);
  console.log('The access token is ' + data.body['access_token']);

  // Save the access token so that it's used in future calls
  spotifyApi.setAccessToken(data.body['access_token']);
}, function(err) {
  console.log('Something went wrong when retrieving an access token', err.message);
});

var app = new Clarifai.App({
  apiKey: Config.CLARIFAI_KEY
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    marginTop: 30,
  },
  listRowContainer: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#8E8E8E',
  },
  text: {
    marginLeft: 12,
    fontSize: 24,
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    padding: 16,
    right: 0,
    left: 0,
    alignItems: 'center',
  },
  topOverlay: {
    top: 0,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomOverlay: {
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 40,
  },
  typeButton: {
    padding: 5,
  },
  flashButton: {
    padding: 5,
  },
  buttonsSpace: {
    width: 10,
  },
});

export default class CurrentMood extends React.Component {
  constructor(props) {
    super(props);

    this.camera = null;
    this.tags = [];
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      camera: {
        aspect: Camera.constants.Aspect.fill,
        captureTarget: Camera.constants.CaptureTarget.memory,
        type: Camera.constants.Type.back,
        orientation: Camera.constants.Orientation.auto,
        flashMode: Camera.constants.FlashMode.auto,
      },
      isRecording: false,
      //tags: [], 
      dataSource: this.ds.cloneWithRows(this.tags),
      pictureTaken: false
      };
  }

  changePictureView() {
    this.setState({pictureTaken: true})
  }

  takePicture = () => {
    if (this.camera) {
      this.camera.capture()
        .then((picture) => {
          //console.log(picture)
          app.models.predict(Clarifai.GENERAL_MODEL, picture.data).then(
          (res) => {
            //console.log('Clarifai response = ', res);
            //let tags = [];
            for (let i = 0; i<res.outputs[0].data.concepts.length; i++) {
              this.tags.push(res.outputs[0].data.concepts[i].name);
            }
            this.setState({dataSource: this.ds.cloneWithRows(this.tags)});
            //this.setState({tagText:tags});
            //console.log('tags array: ' + this.tags.toString());
            this.changePictureView(); 
            //console.log('picture taken: ' + this.state.pictureTaken);                     
          },
          (error)=>{
            console.log(error);  
          });
        })
        .catch(err => console.error(err));
    }
  }

  startRecording = () => {
    if (this.camera) {
      this.camera.capture({mode: Camera.constants.CaptureMode.video})
          .then((data) => console.log(data))
          .catch(err => console.error(err));
      this.setState({
        isRecording: true
      });
    }
  }

  stopRecording = () => {
    if (this.camera) {
      this.camera.stopCapture();
      this.setState({
        isRecording: false
      });
    }
  }

  switchType = () => {
    let newType;
    const { back, front } = Camera.constants.Type;

    if (this.state.camera.type === back) {
      newType = front;
    } else if (this.state.camera.type === front) {
      newType = back;
    }

    this.setState({
      camera: {
        ...this.state.camera,
        type: newType,
      },
    });
  }

  get typeIcon() {
    let icon;
    const { back, front } = Camera.constants.Type;

    if (this.state.camera.type === back) {
      icon = require('./assets/ic_camera_rear_white.png');
    } else if (this.state.camera.type === front) {
      icon = require('./assets/ic_camera_front_white.png');
    }

    return icon;
  }

  switchFlash = () => {
    let newFlashMode;
    const { auto, on, off } = Camera.constants.FlashMode;

    if (this.state.camera.flashMode === auto) {
      newFlashMode = on;
    } else if (this.state.camera.flashMode === on) {
      newFlashMode = off;
    } else if (this.state.camera.flashMode === off) {
      newFlashMode = auto;
    }

    this.setState({
      camera: {
        ...this.state.camera,
        flashMode: newFlashMode,
      },
    });
  }

  get flashIcon() {
    let icon;
    const { auto, on, off } = Camera.constants.FlashMode;

    if (this.state.camera.flashMode === auto) {
      icon = require('./assets/ic_flash_auto_white.png');
    } else if (this.state.camera.flashMode === on) {
      icon = require('./assets/ic_flash_on_white.png');
    } else if (this.state.camera.flashMode === off) {
      icon = require('./assets/ic_flash_off_white.png');
    }

    return icon;
  }

  renderCamera() {
    return (
      <View style={styles.container}>
        <StatusBar
          animated
          hidden
        />
        <Camera
          ref={(cam) => {
            this.camera = cam;
          }}
          style={styles.preview}
          aspect={this.state.camera.aspect}
          captureTarget={this.state.camera.captureTarget}
          type={this.state.camera.type}
          flashMode={this.state.camera.flashMode}
          onFocusChanged={() => {}}
          onZoomChanged={() => {}}
          defaultTouchToFocus
          mirrorImage={false}
        />
        <View style={[styles.overlay, styles.topOverlay]}>
          <TouchableOpacity
            style={styles.typeButton}
            onPress={this.switchType}
          >
            <Image
              source={this.typeIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.flashButton}
            onPress={this.switchFlash}
          >
            <Image
              source={this.flashIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={[styles.overlay, styles.bottomOverlay]}>
          {
            !this.state.isRecording
            &&
            <TouchableOpacity
                style={styles.captureButton}
                onPress={this.takePicture}
            >
              <Image
                  source={require('./assets/ic_photo_camera_36pt.png')}
              />
            </TouchableOpacity>
            ||
            null
          }
          <View style={styles.buttonsSpace} />
          {
              !this.state.isRecording
              &&
              <TouchableOpacity
                  style={styles.captureButton}
                  onPress={this.startRecording}
              >
                <Image
                    source={require('./assets/ic_videocam_36pt.png')}
                />
              </TouchableOpacity>
              ||
              <TouchableOpacity
                  style={styles.captureButton}
                  onPress={this.stopRecording}
              >
                <Image
                    source={require('./assets/ic_stop_36pt.png')}
                />
              </TouchableOpacity>
          }
        </View>
      </View>
    );
}

_pressRow = (rowData) => {
  //console.log("clicked: " + rowData);
  spotifyApi.searchPlaylists(rowData)
  .then(function(data) {
    console.log('Found playlists are', data.body);
    var url = data.body.playlists.items[0].external_urls.spotify;
    Linking.openURL(url);
  }, function(err) {
    console.log('Something went wrong!', err);
  });
}

renderListView(){

return (

  <ListView
    style={styles.listContainer}
    dataSource={this.state.dataSource}
    renderRow={(rowData) => 
    <TouchableHighlight underlayColor = '#E9F7FD' onPress={() => this._pressRow(rowData)} >
      <View style = {styles.listRowContainer}>

        <Text style = {styles.text}>
          {rowData}
        </Text>

      </View>
    </TouchableHighlight>
      }
    renderSeparator={(sectionId, rowId) => <View key={rowId} style={styles.separator} />}
   />
)

}

render() {
    if (!this.state.pictureTaken){
      return this.renderCamera();
    }
    else {
      return this.renderListView();
    }
}
}

