import React, {Component} from 'react';
import {
    StyleSheet,
    ScrollView,
    FlatList,
    View,
    Text,
    Alert,
    Dimensions,
    TextInput,
    Platform, KeyboardAvoidingView, TouchableOpacity,
} from 'react-native';
import Header from '../../../../components/Header/index'

// import IMUI from 'aurora-imui-react-native'
// let InputView = IMUI.ChatInput;
// let MessageListView = IMUI.MessageList;
// const AuroraIController = IMUI.AuroraIMUIController;
const window = Dimensions.get('window');

import JMessage from 'jmessage-react-plugin';
import {Button, Image, Input} from "react-native-elements";

let flatList = React.createRef<any>();
let textInput = React.createRef<any>();
export default class Chat extends Component {

    private conversation: any;
    private myInfo: any;
    private props: any;
    private state: any;
    private messageListDidLoadCallback: any;
    private receiveMessageCallBack: (message) => void;

    constructor(props) {
        super(props);
        this.state = {
            from: 0,
            limit: 10,
            messageList: [],
            content: '',
            inputBoxHeight: 62
        };

        this.conversation = this.props.navigation.state.params.conversation;
        console.warn('page params', JSON.stringify(this.conversation))

        JMessage.getMyInfo((myInfo) => {
            this.myInfo = myInfo;

        })
    }

    appendMessages = (msg) => {
        let list = this.state.messageList;
        this.setState({messageList: list.concat(...msg)},
            () => {
                this.scrollToBottom();
            });
    }

    insertMessagesToTop = (newList) => {
        let list = this.state.messageList;
        this.setState({messageList: list.concat(...newList)},
            () => {
                this.scrollToBottom();
            });
    }

    updateMessage = (msg) => {

    }
    scrollToBottom = () => {
        setTimeout(() => {
            flatList && flatList.scrollToEnd();
        }, 100)
    }

    convertJMessageToAuroraMsg(jmessage) {

        let auroraMsg: any = {}
        auroraMsg.msgType = jmessage.type
        auroraMsg.msgId = jmessage.id

        if (jmessage.type === 'text') {
            auroraMsg.text = jmessage.text
        }

        if (jmessage.type === 'image') {
            auroraMsg.mediaPath = jmessage.thumbPath
        }

        if (jmessage.type === 'voice') {
            auroraMsg.mediaPath = jmessage.path
            auroraMsg.duration = jmessage.duration
        }

        if (jmessage.type === 'file') {
            if (jmessage.extras.fileType === 'video') {
                auroraMsg.mediaPath = jmessage.path
                auroraMsg.duration = jmessage.duration
                auroraMsg.msgType = "video"
            } else {
                console.log("cann't parse this file type ignore")
                return {}
            }
        }

        if (jmessage.type === 'event') {
            Alert.alert('event', jmessage.eventType)
            auroraMsg.text = jmessage.eventType
        }

        if (jmessage.type === 'prompt') {
            auroraMsg.msgType = 'event'
            auroraMsg.text = jmessage.promptText
        }

        if (jmessage.type === 'custom') {
            auroraMsg.msgType = 'house';
            auroraMsg.text = jmessage.customObject;
        }

        let user = {
            userId: "1",
            displayName: "",
            avatarPath: "1111111"
        }

        console.log("from user: " + jmessage.from.avatarThumbPath)
        user.userId = jmessage.from.username
        user.displayName = jmessage.from.nickname
        user.avatarPath = jmessage.from.avatarThumbPath
        if (user.displayName == "") {
            user.displayName = jmessage.from.username
        }
        if (user.avatarPath == "") {
            user.avatarPath = "ironman"
        }
        auroraMsg.fromUser = user
        auroraMsg.status = "send_succeed"

        auroraMsg.isOutgoing = true

        if (this.myInfo.username === jmessage.from.username) {
            auroraMsg.isOutgoing = true
        } else {
            auroraMsg.isOutgoing = false
        }

        auroraMsg.timeString = ""

        return auroraMsg
    }

    getNormalMessage() {
        let msg: any = {}
        if (this.conversation.type === 'single') {
            msg.username = this.conversation.username
        } else if (this.conversation.type === "group") {
            msg.groupId = this.conversation.groupId
        } else {
            msg.roomId = this.conversation.roomId
        }
        msg.type = this.conversation.type
        return msg
    }

    sendCustomMessage = () => {

        let message: any = this.getNormalMessage()
        message.messageType = "custom"
        message.customObject = {
            ConverPic: 'https://newfunrenting.oss-cn-zhangjiakou.aliyuncs.com/funrenting/1586864244516_6f80b12d-b68c-4ee9-9ca3-f8959b96e2e5?x-oss-process=image/resize,w_200',
            KeyId: '104670',
            Title: '整租 高新区 电视剧粉红色大家好环境',
            Money: '850元/月',
            CityCode:'510100'
        }


        JMessage.createSendMessage(message, (msg) => {

            let auroraMsg: any = this.convertJMessageToAuroraMsg(msg)
            if (auroraMsg.msgType === undefined) {
                return
            }
            auroraMsg.status = 'send_going'
            this.appendMessages([auroraMsg]);
            this.scrollToBottom();
            this.setMessageTarget(msg);
            msg.messageSendingOptions = {
                needReadReceipt: true,
                isShowNotification: true,
                isRetainOffline: true,
                isCustomNotificationEnabled: true,
                notificationTitle: "Title Test",
                notificationText: "context"
            };

            this.scrollToBottom();
            JMessage.sendCustomMessage(msg, jmessage => {
                let auroraMsg = this.convertJMessageToAuroraMsg(jmessage)
                this.updateMessage(auroraMsg)
                console.log('JS sendCustomMessage success:' + JSON.stringify(jmessage))
            }, error => {
                console.log('JS sendCustomMessage error:' + JSON.stringify(error))
            })
        })
    }

    componentDidMount() {
        // this.resetMenu()
        let parames = {
            from: this.state.from,            // 开始的消息下标。
            limit: this.state.limit,            // 要获取的消息数。比如当 from = 0, limit = 10 时，是获取第 0 - 9 条历史消息。
            type: this.conversation.type,
            username: this.conversation.username,
            groupId: this.conversation.groupId,
            roomId: this.conversation.roomId
        }

        this.messageListDidLoadCallback = () => {
            JMessage.getHistoryMessages(parames, (messages) => {
                this.setState({
                    from: this.state.from + 10
                })

                let auroraMessages = messages.map((message) => {
                    let normalMessage = this.convertJMessageToAuroraMsg(message)
                    if (normalMessage.msgType === "unknow") {
                        return
                    }
                    return normalMessage
                })
                console.warn("JS getHistoryMessage:", auroraMessages);
                this.insertMessagesToTop(auroraMessages)
            }, (error) => {
                Alert.alert('error!', JSON.stringify(error))
            })

            this.receiveMessageCallBack = (message) => {

                console.log("JS receiveMessage:" ,message);
                const readParams = {
                    type: "single",
                    username: message.from.username,
                    appKey: message.from.appKey,
                    id: message.id,
                }

                //JMessage.setMsgHaveRead(readParams,(result) => {},(error) => {})

                if (this.conversation.type === 'single') {
                    if (message.target.type === 'user') {
                        if (message.from.username === this.conversation.username) {
                            let msg = this.convertJMessageToAuroraMsg(message)
                            this.appendMessages([msg])
                        }
                    }
                } else if (this.conversation.type === 'group') {
                    if (message.target.type === 'group') {
                        if (message.from.id === this.conversation.groupId) {
                            let msg = this.convertJMessageToAuroraMsg(message)
                            this.appendMessages([msg])
                        }
                    }
                } else {
                    if (message.target.type === 'chatroom') {
                        if (message.target.roomId === this.conversation.roomId) {
                            let msg = this.convertJMessageToAuroraMsg(message)
                            this.appendMessages([msg])
                        }
                    }
                }
            }
            JMessage.addReceiveMessageListener(this.receiveMessageCallBack)
            //JMessage.addReceiptMessageListener((result)=>{})


        }
        this.messageListDidLoadCallback();
        this.sendCustomMessage();
    }

    onInputViewSizeChange = (size) => {
        console.log("height: " + size.height)
        if (this.state.inputLayoutHeight != size.height) {
            this.setState({
                inputLayoutHeight: size.height,
                inputViewLayout: {width: size.width, height: size.height},
                messageListLayout: {flex: 1, width: window.width, margin: 0}
            })
        }
    }

    componentWillUnmount() {
        JMessage.removeReceiveMessageListener(this.receiveMessageCallBack)
        if (this.conversation.type === "chatroom") {
            JMessage.leaveChatRoom({roomId: this.conversation.roomId}, (code) => {
                console.log("Leave chat room succeed")
            }, (error) => {
                alert("error: " + JSON.stringify(error))
            })
        } else {
            JMessage.exitConversation()
        }

    }

    resetMenu() {
        if (Platform.OS === "android") {
            // this.refs["ChatInput"].showMenu(false)
            this.setState({
                messageListLayout: {flex: 1, width: window.width, margin: 0},
            })
        } else {
            this.setState({
                inputViewLayout: {width: window.width, height: 86}
            })
        }
    }

    updateLayout(layout) {
        this.setState({inputViewLayout: layout})
    }

    onAvatarClick = (message) => {

    }

    onTouchMsgList() {
        // AuroraIController.hidenFeatureView(true)
    }

    onTouchEditText = () => {
        console.log("scroll to bottom")
        // this.refs["ChatInput"].showMenu(false)
        this.setState({
            inputViewLayout: {width: window.width, height: this.state.inputLayoutHeight}
        })
    }

    onFullScreen = () => {
        let navigationBar = 50
        this.setState({
            messageListLayout: {flex: 0, width: 0, height: 0},
            inputViewLayout: {flex: 1, width: window.width, height: window.height}
        })
    }

    onRecoverScreen = () => {
        this.setState({
            messageListLayout: {flex: 1, width: window.width, margin: 0},
            inputViewLayout: {flex: 0, width: window.width, height: this.state.inputLayoutHeight}
        })
    }

    onMsgClick = (message) => {
        if (message.msgType === 'house') {
            this.props.navigation.push('HouseDetail', {...message.text})
        }
        console.log(message);
        // alert(JSON.stringify(message))
    }

    onMsgLongClick = (message) => {
        let msg: any = {}
        msg.type = 'group'
        msg.groupId = this.conversation.groupId
        msg.messageId = message.msgId
        Alert.alert('撤回消息', '撤回消息')
        JMessage.retractMessage(msg, (success) => {
            let eventMsg: any = {}
            eventMsg.msgId = message.msgId
            eventMsg.msgType = "event"
            eventMsg.text = "撤回的消息"
            this.updateMessage(eventMsg);
        }, (error) => {

        })

    }

    onStatusViewClick = (message) => {
        console.log(message)
        message.status = 'send_succeed'
        message.fromUser.avatarPath = message.mediaPath
        this.updateMessage(message)
    }

    onBeginDragMessageList = () => {
        this.updateLayout({width: window.width, height: 86,})
        // AuroraIController.hidenFeatureView(true)
    }

    onPullToRefresh = () => {
        console.log("on pull to refresh")
        let parames = {

            from: this.state.from,            // 开始的消息下标。
            limit: this.state.limit,            // 要获取的消息数。比如当 from = 0, limit = 10 时，是获取第 0 - 9 条历史消息。
            type: this.conversation.type,
            username: this.conversation.username,
            groupId: this.conversation.groupId,
            roomId: this.conversation.roomId
        }
        JMessage.getHistoryMessages(parames, (messages) => {
            if (Platform.OS == "android") {
                // this.refs["MessageList"].refreshComplete()
            }
            this.setState({
                from: this.state.from + 10
            })
            let auroraMessages = messages.map((message) => {
                let normalMessage = this.convertJMessageToAuroraMsg(message)
                if (normalMessage.msgType === "unknow") {
                    return
                }
                return normalMessage
            })
            this.insertMessagesToTop(auroraMessages)
        }, (error) => {
            Alert.alert('error!', JSON.stringify(error))
        })
    }


    setMessageTarget = (msg) => {
        if (this.conversation.type === 'single') {
            msg.username = this.conversation.username
        } else if (this.conversation.type === "group") {
            msg.groupId = this.conversation.groupId
        } else {
            msg.roomId = this.conversation.roomId
        }
        msg.type = this.conversation.type
    }

    onSendText = (text) => {
        // JMessage.createGroup({'name':'群','desc':'描述','groupType':'public'},success => {
        //   console.log('JS createGroup success:'+JSON.stringify(success))
        // },error => {
        //   console.log('JS createGroup error:'+JSON.stringify(error))
        // })

        // 34863871

        // JMessage.addGroupMembers({'id':'34863871','usernameArray':['wicked','wicked001','qqqqqq'],'appKey':'58067d5678c387f20831a956'},success => {
        //   console.log('JS addGroupMembers success:'+JSON.stringify(success))
        // },error => {
        //   console.log('JS addGroupMembers error:'+JSON.stringify(error))
        // })

        // let parames = {
        //   'type':'group',
        //   'groupId':'34863871',
        //   'username':'wwwwww',
        //   'appKey':'58067d5678c387f20831a956',
        //   'messageType':'text',
        //   'text':'123456',
        //   'groupAt':true,
        //   'usernames':['wicked','qqqqqq']
        // }

        // JMessage.sendGroupAtMessage(parames,success => {
        //   console.log('JS sendGroupAtMessage success:'+JSON.stringify(success))
        // },error => {
        //   console.log('JS sendGroupAtMessage error:'+JSON.stringify(error))
        // })

        // JMessage.createSendMessage(parames,
        // message => {console.log('JS createSendMessage groupAt:'+JSON.stringify(message))

        //   let groupAtMessage = {
        //     'type' : 'group',
        //     'groupId' : message.target.id,
        //     'appKey':'58067d5678c387f20831a956',
        //     'id' : ''+ message.id,
        //     'messageType' : message.type,
        //     'text' : message.text,
        //   }

        //   JMessage.sendMessage(groupAtMessage, success => {
        //     console.log('JS sendMessage success groupAt:'+JSON.stringify(success))
        //   }, error => {
        //     console.log('JS sendMessage error groupAt:'+JSON.stringify(error))
        //   })
        //   }
        // )

        let message = this.getNormalMessage()
        message.text = text
        message.messageType = "text"
        // message.messageType = "custom"
        // message.customObject = {'key':'value'}
        JMessage.createSendMessage(message, (msg) => {
            console.log('JS createSendMessage:' + JSON.stringify(msg))
            let auroraMsg = this.convertJMessageToAuroraMsg(msg)
            if (auroraMsg.msgType === undefined) {
                return
            }

            auroraMsg.status = 'send_going'
            this.appendMessages([auroraMsg])
            this.scrollToBottom()
            this.setMessageTarget(msg)

            msg.messageSendingOptions = {
                needReadReceipt: true,
                isShowNotification: true,
                isRetainOffline: true,
                isCustomNotificationEnabled: true,
                notificationTitle: "Title Test",
                notificationText: "context"
            };

            JMessage.sendMessage(msg, (jmessage) => {
                let auroraMsg = this.convertJMessageToAuroraMsg(jmessage)
                this.updateMessage(auroraMsg)
                console.log('JS sendMessage success:' + JSON.stringify(jmessage))
            }, (error) => {
                console.log('JS sendMessage error:' + JSON.stringify(error))
            })

            // 这里的路径以android为例
            let userName = "";
            let appKey = "";
            let videoFilePath = "sdcard/DCIM/1.mp4";
            let videoFileName = "xxxxxx";
            let videoImagePath = "sdcard/DCIM/1.png";
            let videoImageFormat = "png";
            let videoDuration = 10;
            // JMessage.sendVideoMessage({'type': 'single','username': userName,'appKey': appKey,
            //       "path":videoFilePath,"name":videoFileName,"thumbPath":videoImagePath,"thumbFormat":videoImageFormat,"duration":videoDuration},
            //       (msg) => {
            //           console.log("sendVideo success");
            //       },(error) => {
            //           console.log("sendVideo error:"+error.description);
            //       });

        })
    }

    onTakePicture = (media) => {
        console.log("onTakePicture, path: " + media)
        let message = this.getNormalMessage()
        message.messageType = "image"
        message.path = media.mediaPath

        JMessage.createSendMessage(message, (msg) => {
            let auroraMsg = this.convertJMessageToAuroraMsg(msg)
            auroraMsg.status = 'send_going'
            this.appendMessages([auroraMsg])
            // this.scrollToBottom(true)
            this.setMessageTarget(msg)
            JMessage.sendMessage(msg, (jmessage) => {
                let auroraMsg = this.convertJMessageToAuroraMsg(jmessage)
                this.updateMessage(auroraMsg)
            }, (error) => {
                Alert.alert(`send image fail ${JSON.stringify(error)}`)
            })
        })
    }

    onStartRecordVoice = (e) => {
        console.log("on start record voice")
    }

    onFinishRecordVoice = (mediaPath) => {
        Alert.alert('onFinishRecordVoice', JSON.stringify(mediaPath))
        let message = this.getNormalMessage()
        message.messageType = "voice"
        message.path = mediaPath

        JMessage.createSendMessage(message, (msg) => {
            let auroraMsg = this.convertJMessageToAuroraMsg(msg)
            auroraMsg.status = 'send_going'
            this.appendMessages([auroraMsg])
            // AuroraIController.scrollToBottom(true)
            this.setMessageTarget(msg)
            JMessage.sendMessage(msg, (jmessage) => {
                let auroraMsg = this.convertJMessageToAuroraMsg(jmessage)
                this.updateMessage(auroraMsg)
            }, (error) => {
                Alert.alert(`send image fail ${JSON.stringify(error)}`)
            })
        })
    }

    onCancelRecordVoice = () => {
        console.log("on cancel record voice")
    }

    onStartRecordVideo = () => {
        console.log("on start record video")
    }

    onFinishRecordVideo = (video) => {
        let message = this.getNormalMessage()
        message.messageType = "file"
        message.extras = {fileType: 'video'}
        message.path = video.mediaPath

        JMessage.createSendMessage(message, (msg) => {
            let auroraMsg = this.convertJMessageToAuroraMsg(msg)
            auroraMsg.status = 'send_going'
            this.appendMessages([auroraMsg])
            // AuroraIController.scrollToBottom(true)
            this.setMessageTarget(msg)

            JMessage.sendMessage(msg, (jmessage) => {
                let auroraMsg = this.convertJMessageToAuroraMsg(jmessage)
                this.updateMessage(auroraMsg)
            }, (error) => {
                Alert.alert(`send image fail ${JSON.stringify(error)}`)
            })
        })
    }

    onSendGalleryFiles = (mediaFiles) => {
        for (let index in mediaFiles) {
            Alert.alert('onSendGalleryFiles', JSON.stringify(mediaFiles[index]['mediaPath']))
            let message = this.getNormalMessage()
            message.messageType = "image"
            message.path = mediaFiles[index].mediaPath

            JMessage.createSendMessage(message, (msg) => {
                let auroraMsg = this.convertJMessageToAuroraMsg(msg)
                auroraMsg.status = 'send_going'
                this.appendMessages([auroraMsg])
                // AuroraIController.scrollToBottom(true)
                this.setMessageTarget(msg)
                JMessage.sendMessage(msg, (jmessage) => {
                    let auroraMsg = this.convertJMessageToAuroraMsg(jmessage)
                    this.updateMessage(auroraMsg)
                }, (error) => {
                    Alert.alert(`send image fail ${JSON.stringify(error)}`)
                })
            })
        }
    }

    onSwitchToMicrophoneMode = () => {
        // AuroraIController.scrollToBottom(true)
    }

    onSwitchToGalleryMode = () => {
        // AuroraIController.scrollToBottom(true)
    }

    onSwitchToCameraMode = () => {
        // AuroraIController.scrollToBottom(true)
    }

    onShowKeyboard = (keyboard_height) => {
        let inputViewHeight = keyboard_height + 86
        this.updateLayout({width: window.width, height: inputViewHeight,})
    }

    onSwitchToEmojiMode = () => {
        // AuroraIController.scrollToBottom(true)
    }

    onInitPress() {
        console.log('on click init push');
        // this.updateAction();
    }

    render() {
        let {content, messageList, inputBoxHeight} = this.state;
        let {username} = this.conversation;
        console.log('window.height', messageList)
        return (
            <View style={styles.container}>

                <Header title={username}/>

                <View style={[styles.scrollView, {height: (window.height - (inputBoxHeight + 70))}]}>
                    <FlatList
                        ref={res => flatList = res}
                        data={messageList}
                        renderItem={(item) => <ListItem messageClick={this.onMsgClick} {...item}/>}
                    />
                </View>

                <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={-10} style={{width: '100%'}}>
                    <View style={[styles.inputLine, {height: inputBoxHeight}]}>
                        <View style={styles.inputBox}>
                            <TextInput style={styles.input}
                                       value={content}
                                       ref={res => textInput = res}
                                       onChangeText={content => this.setState({content})}/>
                        </View>
                        <Button containerStyle={{marginLeft: 10}}
                                disabled={content.trim().length === 0}
                                title='发送'
                                onPress={() => {
                                    this.onSendText(content);
                                    textInput.blur();
                                    this.setState({content: ''})
                                }}/>
                    </View>
                </KeyboardAvoidingView>
                {/*<MessageListView style={this.state.messageListLayout}*/}
                {/*                 ref="MessageList"*/}
                {/*                 onAvatarClick={this.onAvatarClick}*/}
                {/*                 onMsgClick={this.onMsgClick}*/}
                {/*                 onMsgLongClick={this.onMsgLongClick}*/}
                {/*                 onStatusViewClick={this.onStatusViewClick}*/}
                {/*                 onTouchMsgList={this.onTouchMsgList}*/}
                {/*                 onTapMessageCell={this.onTapMessageCell}*/}
                {/*                 onBeginDragMessageList={this.onBeginDragMessageList}*/}
                {/*                 onPullToRefresh={this.onPullToRefresh}*/}
                {/*                 avatarSize={{ width: 40, height: 40 }}*/}
                {/*                 sendBubbleTextSize={18}*/}
                {/*                 sendBubbleTextColor={"#000000"}*/}
                {/*                 sendBubblePadding={{ left: 10, top: 10, right: 15, bottom: 10 }}*/}
                {/*/>*/}
                {/*<InputView style={this.state.inputViewLayout}*/}
                {/*           ref="ChatInput"*/}
                {/*           menuContainerHeight={this.state.menuContainerHeight}*/}
                {/*           isDismissMenuContainer={this.state.isDismissMenuContainer}*/}
                {/*           onSendText={this.onSendText}*/}
                {/*           onTakePicture={this.onTakePicture}*/}
                {/*           onStartRecordVoice={this.onStartRecordVoice}*/}
                {/*           onFinishRecordVoice={this.onFinishRecordVoice}*/}
                {/*           onCancelRecordVoice={this.onCancelRecordVoice}*/}
                {/*           onStartRecordVideo={this.onStartRecordVideo}*/}
                {/*           onFinishRecordVideo={this.onFinishRecordVideo}*/}
                {/*           onSendGalleryFiles={this.onSendGalleryFiles}*/}
                {/*           onSwitchToEmojiMode={this.onSwitchToEmojiMode}*/}
                {/*           onSwitchToMicrophoneMode={this.onSwitchToMicrophoneMode}*/}
                {/*           onSwitchToGalleryMode={this.onSwitchToGalleryMode}*/}
                {/*           onSwitchToCameraMode={this.onSwitchToCameraMode}*/}
                {/*           onShowKeyboard={this.onShowKeyboard}*/}
                {/*           onTouchEditText={this.onTouchEditText}*/}
                {/*           onFullScreen={this.onFullScreen}*/}
                {/*           onRecoverScreen={this.onRecoverScreen}*/}
                {/*           onSizeChange={this.onInputViewSizeChange}*/}
                {/*/>*/}
            </View>
        );
    }
}

const ListItem = (props) => {
    console.warn('props', props)
    let {item} = props;
    let messageBox = null;
    if (item.msgType === 'text') {
        messageBox = <TextMessage {...item}/>
    } else if (item.msgType === 'house') {
        messageBox = <HouseMessage {...item}/>
    }

    return (
        <View style={styles.itemContainer}>
            <View style={styles.messageTime}>
                <Text style={styles.desc}>12:01</Text>
            </View>
            <View style={styles.messageItem}>
                {
                    item.isOutgoing ? (
                        <View style={styles.toMe}>
                            <TouchableOpacity onPress={()=>props.messageClick(item)}>
                                {messageBox}
                            </TouchableOpacity>

                            <View style={[styles.userAvatarBox, {marginLeft: 10}]}>
                                <Image style={styles.userAvatar} source={{uri: item.fromUser.avatarPath}}/>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.toYou}>
                            <View style={[styles.userAvatarBox, {marginRight: 10}]}>
                                <Image style={styles.userAvatar} source={{uri: item.fromUser.avatarPath}}/>
                            </View>

                            <TouchableOpacity onPress={()=>props.messageClick(item)}>
                                {messageBox}
                            </TouchableOpacity>
                        </View>
                    )
                }
            </View>
        </View>
    );
}

const TextMessage = (props) => {
    return (
        <View style={styles.messageBox}>
            <Text>{props.text}</Text>
        </View>
    )
}
const HouseMessage = (props) => {
    return (
        <View style={styles.houseBox}>
            <View style={styles.houseImageBox}>
                <Image style={styles.houseImage} source={{uri: props.text.ConverPic}}/>
            </View>
            <View style={styles.houseTextBox}>
                <View>
                    <Text style={styles.houseTitle} numberOfLines={1}>{props.text.Title}</Text>
                </View>
                <View>
                    <Text style={styles.houseMoney} numberOfLines={1}>{props.text.Money}</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    scrollView: {
        width: '100%'
    },
    inputLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#e2e2e2',
        backgroundColor: 'white'
    },
    inputBox: {
        flexShrink: 1,
        width: '100%',
        height: 40,
        borderColor: '#999999',
        borderWidth: 1,
        borderRadius: 50,
        paddingHorizontal: 20
    },
    input: {
        width: '100%',
        margin: 0,
        padding: 0,
        height: 40,
        lineHeight: 40
    },
    itemContainer: {
        marginBottom: 20,
        paddingHorizontal: 20
    },
    messageTime: {
        // justifyContent: 'center',
    },
    desc: {
        textAlign: 'center',
        color: '#cecece'
    },
    messageItem: {},
    toMe: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    toYou: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    messageBox: {
        borderColor: '#999999',
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
        flexShrink: 1,
    },
    userAvatarBox: {
        height: 50,
        width: 50,
    },
    userAvatar: {
        height: 50,
        width: 50,
        borderRadius: 50
    },
    houseBox: {
        borderRadius: 8,
        borderWidth:1,
        overflow: 'hidden',
        borderColor: '#e2e2e2'
    },
    houseImageBox: {},
    houseImage: {
        width: 200,
        height: 120,
        resizeMode:'cover'
    },
    houseTextBox: {
        width: 200,
        backgroundColor: 'white',
        padding: 10,
    },
    houseTitle: {
        fontSize: 14,
        fontWeight: '700'
    },
    houseMoney: {
        marginTop:5,
        color: '#389ef2',
        fontWeight: '700'
    }
});
