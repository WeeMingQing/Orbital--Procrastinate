"use strict";
import React, { useState, useEffect } from "react";
import moment from "moment";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Modal,
  Image,
  Pressable,
  TextInput,
  Animated,
  Platform,
} from "react-native";
import { Agenda } from "react-native-calendars";
import {
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Card, Avatar } from "react-native-paper";
import { dbInit } from "../../firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Swipeable } from "react-native-gesture-handler";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
const SetCalendar = ({ navigation }) => {
  const docRef = doc(dbInit, "users", getAuth().currentUser.uid);
  const [items, setItems] = useState({});
  const [unmodfiedItems, setUnmodifiedItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [task, setTask] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(0);
  const [visible, setVisibility] = useState(false);
  const [itemFocus, setItemFocus] = useState({});
  const [updateItem, setupdateItem] = useState(false);
  const [chooseDate, setChooseDate] = useState(false);
  const [chooseTime, setChooseTime] = useState(false);
  const [os, setOS] = useState(true);

  const convertDate = (date) => {
    const extraMonthFormat = date.getMonth() + 1 < 10 ? "0" : "";
    const extraDayFormat = date.getDate() < 10 ? "0" : "";
    return `${date.getFullYear()}-${extraMonthFormat}${
      date.getMonth() + 1
    }-${extraDayFormat}${date.getDate()}`;
  };

  const [dateFormat, setDateFormat] = useState(convertDate(date));

  let fDateTime = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`;

  const onChange = (event, selectedDate) => {
    fDateTime = convertDate(selectedDate);
    let x = moment(selectedDate).format("YYYY-MM-DD HH:mm:ss");
    let time = x.split(" ")[1];
    const hour = time.split(":")[0];
    const minutes = time.split(":")[1];
    setDate(selectedDate);
    setDateFormat(convertDate(selectedDate));
    setStartTime(parseInt(hour) * 60 + parseInt(minutes));
    if (os === false && chooseDate === true) {
      setChooseDate(false);
    }
  };

  const onChangeTime = (event, selectedTime) => {
    let x = moment(selectedTime).format("YYYY-MM-DD HH:mm:ss");
    let time = x.split(" ")[1];
    const hour = time.split(":")[0];
    const minutes = time.split(":")[1];
    setDate(selectedTime);
    setStartTime(parseInt(hour) * 60 + parseInt(minutes));
    if (os === false && chooseTime === true) {
      setChooseTime(false);
    }
  };

  const handleUpdate = async (oldData, obj, docRef) => {
    if (Object.keys(oldData).length === 0) {
      await updateDoc(docRef, { tasks: arrayUnion(obj) });
    } else {
      await updateDoc(docRef, {
        tasks: arrayRemove(oldData),
      });
      let updatedTasks = [...oldData.tasks, ...obj.tasks];
      updatedTasks.sort((a, b) => {
        return parseInt(a.startTime) - parseInt(b.startTime);
      });
      let newObj = { date: dateFormat, tasks: updatedTasks };
      await updateDoc(docRef, { tasks: arrayUnion(newObj) });
    }
    setupdateItem(!updateItem);
  };

  const handleDelete = async (oldData, newData, docRef) => {
    await updateDoc(docRef, { tasks: arrayRemove(oldData) });
    await updateDoc(docRef, { tasks: arrayUnion(newData) });
    setupdateItem(!updateItem);
  };

  useEffect(() => {
    setOS(Platform.OS === "ios");
    console.log("effect run 2");
    let result = {};
    let unmodifiedResult = [];
    return onSnapshot(
      doc(dbInit, "users", getAuth().currentUser.uid),
      (doc) => {
        let allData = doc.data().tasks;
        allData.forEach((element) => {
          unmodifiedResult.push(element);
          const dateInput = element.date;
          element.tasks.sort((a, b) => {
            return parseInt(a.startTime) - parseInt(b.startTime);
          });

          result[dateInput] = element.tasks;
        });
        setItems(result);
        setUnmodifiedItems(unmodifiedResult);
      }
    );
  }, [updateItem]);

  const convertTime = (time) => {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const appendHr = hours < 10 ? "0" : "";
    const appendMins = minutes < 10 ? "0" : "";
    return `${appendHr}${hours}:${appendMins}${minutes}`;
  };

  const RightActions = ({ progress, dragX, onPress }) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
    return (
      <TouchableOpacity onPress={onPress}>
        <View style={styles.rightAction}>
          <Animated.Text
            style={[styles.actionText, { transform: [{ scale }] }]}
          >
            Delete
          </Animated.Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = (item) => {
    const onRightPress = () => {
      const date = item.date;
      const oldData = unmodfiedItems.filter((ele) => ele.date === item.date)[0];
      const newtasks = unmodfiedItems
        .filter((ele) => ele.date === item.date)
        .flatMap((ele) => ele.tasks)
        .filter((ele) => ele !== item);
      const newData = { date: date, tasks: newtasks };
      handleDelete(oldData, newData, docRef);
      // console.log(items);
    };
    return (
      <View style={{ justifyContent: "center" }}>
        <Swipeable
          renderRightActions={(progress, dragX) => (
            <RightActions
              progress={progress}
              dragX={dragX}
              onPress={onRightPress}
            />
          )}
          style={{ marginTop: 10, marginBottom: 10 }} // ?
        >
          <TouchableOpacity
            style={{
              shadowColor: "#000000",
              shadowOpacity: 0.8,
              shadowRadius: 2,
              shadowOffset: {
                height: 2,
                width: 1,
              },
              borderBottomWidth: 2,
              borderLeftWidth: 1,
            }}
          >
            <Card>
              <Card.Content>
                <View
                  style={{
                    flexDirection: "column",
                    justifyContent: "center",
                    alignContent: "center",
                  }}
                >
                  <Text
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "#d1d1e0",
                      overflow: "hidden",
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: "#d1d1e0",
                    }}
                  >
                    {convertTime(item.startTime)}
                  </Text>
                  <Text style={{ alignSelf: "center" }}>{item.name}</Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  const renderIOSOrAndroidDatePicker = () => {
    if (os) {
      return (
        <Modal visible={chooseDate} animationType="fade">
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setChooseDate(false)}
              style={{ alignSelf: "flex-end" }}
            >
              <Image
                source={require("../../assets/cross.png")}
                style={styles.modalClose}
              />
            </TouchableOpacity>

            <DateTimePicker
              isVisible={true}
              testID="dateTimePicker"
              value={date}
              mode={"date"}
              display="default"
              is24Hour={true}
              onChange={onChange}
              style={{ width: 200, marginRight: 70 }}
            />
          </View>
        </Modal>
      );
    } else {
      if (chooseDate) {
        return (
          <DateTimePicker
            // isVisible={chooseDate}
            testID="dateTimePicker"
            value={date}
            mode={"date"}
            display="default"
            is24Hour={true}
            onChange={onChange}
            style={{ width: 200, marginRight: 70 }}
          />
        );
      }
    }
  };

  const renderIOSOrAndroidTimePicker = () => {
    console.log(os);
    console.log(chooseTime);
    if (os) {
      return (
        <Modal visible={chooseTime} animationType="fade">
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setChooseTime(false)}
              style={{ alignSelf: "flex-end" }}
            >
              <Image
                source={require("../../assets/cross.png")}
                style={styles.modalClose}
              />
            </TouchableOpacity>

            <DateTimePicker
              isVisible={true}
              testID="dateTimePicker"
              value={date}
              mode={"time"}
              display="default"
              is24Hour={true}
              onChange={onChangeTime}
              style={{ width: 200, marginRight: 70 }}
            />
          </View>
        </Modal>
      );
    } else {
      if (chooseTime) {
        return (
          <DateTimePicker
            isVisible={chooseTime}
            testID="dateTimePicker"
            value={date}
            mode={"time"}
            display="default"
            is24Hour={chooseDate}
            onChange={onChangeTime}
          />
        );
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal visible={modalOpen} animationType="slide">
        <View style={styles.modalContent}>
          <TouchableOpacity
            onPress={() => setModalOpen(false)}
            style={{ alignSelf: "flex-end" }}
          >
            <Image
              source={require("../../assets/cross.png")}
              style={styles.modalClose}
            />
          </TouchableOpacity>

          <View
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: 300,
              height: 700,
              borderColor: "black",
              borderRadius: 5,
              borderWidth: 2,
            }}
          >
            <TouchableOpacity
              style={{ borderRadius: 20, borderWidth: 2 }}
              onPress={() => setChooseDate(true)}
            >
              <Text> Pick a date </Text>
            </TouchableOpacity>
            {renderIOSOrAndroidDatePicker()}
            <Text style={{ marginTop: 25, marginBottom: 25 }}>
              Date Chosen: {dateFormat}
            </Text>

            <TouchableOpacity
              style={{ borderRadius: 20, borderWidth: 2 }}
              onPress={() => setChooseTime(true)}
            >
              <Text> Pick a Time </Text>
            </TouchableOpacity>
            {renderIOSOrAndroidTimePicker()}

            <Text style={{ marginTop: 25, marginBottom: 25 }}>
              Time Chosen: {convertTime(startTime)}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="task 1..."
              onChangeText={(val) => {
                setTask(val);
                console.log(task);
              }}
            />
            <TouchableOpacity
              style={{ borderColor: "black", borderWidth: 2, borderRadius: 5 }}
              onPress={() => {
                const obj = {
                  date: dateFormat,
                  tasks: [
                    {
                      name: task,
                      done: false,
                      startTime: startTime,
                      date: dateFormat,
                    },
                  ],
                };
                let oldData = {};
                unmodfiedItems.forEach((item) => {
                  if (item.date === dateFormat) {
                    oldData = item;
                  }
                });
                handleUpdate(oldData, obj, docRef);
              }}
            >
              <Text> Add Task </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <TouchableOpacity
        style={{ alignSelf: "flex-end" }}
        onPress={() => setModalOpen(true)}
      >
        <Text style={styles.add}> + </Text>
      </TouchableOpacity>
      <Agenda
        items={items}
        minDate={"2018-05-10"}
        renderItem={renderItem}
        renderEmptyData={() => (
          <View style={styles.itemContainer}>
            <Text style={styles.noTasksText}> No tasks </Text>
          </View>
        )}
        showOnlySelectedDayItems={true}
      />
    </View>
  );
};

export default SetCalendar;

const styles = StyleSheet.create({
  noTasksText: {
    fontSize: 40,
  },
  body: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  itemContainer: {
    backgroundColor: "white",
    margin: 10,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },

  add: {
    fontSize: 30,
    margin: 1,
  },

  modalClose: {
    // marginTop: 50,
    // marginRight: 10,
    marginBottom: 10,
    width: 35,
    height: 40,
    resizeMode: "contain",
    alignSelf: "flex-end",
  },

  deleteTaskBtn: {
    // marginTop: 50,
    // marginRight: 10,

    alignSelf: "flex-end",
    justifyContent: "center",
    marginBottom: -20,
    zIndex: 1,
  },

  deleteImg: {
    width: 15,
    height: 20,
    resizeMode: "contain",
  },

  modalContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#777",
    padding: 8,
    margin: 50,
    // margin: 10
    // marginTop: 20,

    // marginRight: 300,
    width: 200,
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  rightAction: {
    backgroundColor: "#dd2c00",
    justifyContent: "center",
    flex: 1,
    alignItems: "flex-end",
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
    padding: 20,
  },
});
