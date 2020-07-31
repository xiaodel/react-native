import {Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View,} from "react-native";
import JMessage from 'jmessage-react-plugin';
import React, {useEffect, useState} from "react";
import {connect} from 'react-redux';
import {setMessage, putMessage} from '../../../../redux/actions/jmessage';
import styles from './styles';
import {getListItem} from "../../../../utils/message/jmessage";
import {Button} from "react-native-elements";
import {withNavigation} from 'react-navigation';

const PageIndex = (props) => {

    const reloadConversationList = () => {
        JMessage.getConversations((result) => {
            props.dispatch(setMessage(result));
        }, (error) => {
            Alert.alert(JSON.stringify(error))
        })
    }

    useEffect(() => {
        JMessage.setDebugMode({
            enable: true
        });

        reloadConversationList();

        // JMessage.addReceiveMessageListener((message) => {
        //     reloadConversationList();
        // })
        // JMessage.addSyncRoamingMessageListener((result) => {
        //     let conv = result.conversation;
        //     console.log("Receive roaming conversation: " + JSON.stringify(conv))
        //     props.dispatch(putMessage(conv));
        // })
    }, []);


    const enterConversation = (item) => {
        reloadConversationList();
        JMessage.enterConversation(item, (status) => {
        }, (error) => {
        })

        props.navigation.navigate('MessageInfo', {
            conversation: {type: item.type, username: item.username, groupId: item.groupId, appKey: item.appKey}
        })
    }

    // 创建单聊
    const createConversation = (params) => {
        JMessage.createConversation(params, (conv) => {
            enterConversation(getListItem(conv))
        }, (error) => {
            Alert.alert('create conversation error !', JSON.stringify(error))
        })
    }

    //创建聊天室
    // var item = {
    //     type: conversation.type,
    //     roomId: conversation.roomId,
    //     name: conversation.roomName,
    //     appKey: conversation.appKey,
    //     owner: conversation.owner,
    // }
    const enterChatRoom = (item) => {
        JMessage.enterChatRoom(item, (conversation) => {
            props.navigation.navigate('MessageInfo', {
                conversation: {type: conversation.conversationType, roomId: conversation.target.roomId}
            })
        }, (error) => {
            console.log("error, code: " + error.code + ", description: " + error.description)
        })
    }

    let [id, setId]: any = useState('15520696601');
    console.warn('messageList', props.messageList)
    return (
        <View>
            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                <TextInput onChangeText={e => setId(e)}
                           style={{width: 200, borderWidth: 1, borderColor: 'cyan', borderRadius: 30}}/>
                <Button onPress={() => {
                    let params: any = {}
                    params.type = 'single'
                    params.username = id
                    createConversation(params)
                }} title='创建会话'/>
            </View>
            <FlatList
                data={props.messageList}
                keyExtractor={(i, index) => `${index}`}
                renderItem={({item}) => <ListItem onClick={(item) => createConversation(item)} data={item}/>}
            />
        </View>
    )
}

const ListItem = (props) => {
    let {data} = props;
    return (
        <TouchableOpacity onPress={() => props.onClick(data)}>
            <View style={[styles.container, {paddingHorizontal: 20}]}>
                <View style={styles.leftContainer}>
                    <Image style={styles.iconImage} source={{uri: data.avatarThumbPath}}/>
                    <View style={styles.nameContainer}>
                        <Text numberOfLines={1} style={styles.title}>{data.username}</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail'
                              style={styles.messageContent}>{data.latestMessageString}</Text>
                    </View>
                </View>

                <View style={styles.rightContainer}>
                    <Text style={styles.time}>6-29</Text>
                    <View style={styles.messageNumberContainer}>
                        <Text style={styles.messageNumberText}>1</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const mapToProps = state => {
    return {
        messageList: state.jmessage.list,
    };
};
export default withNavigation(connect(mapToProps)(PageIndex));
