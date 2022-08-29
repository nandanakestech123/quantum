import React, { Fragment } from "react";
import { Text, View, StyleSheet,Font} from "@react-pdf/renderer";
const borderColor = "#90e5fc";
Font.registerHyphenationCallback(ss => {
  const middle = Math.floor(ss.length/2);
  const parts = ss.length === 1 ? [ss] : [ss.substr(0, middle), ss.substr(middle)];

  // Check console to see words parts
  console.log(ss, parts);

  return parts;
});
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomColor: "#bff0fd",
    borderBottomWidth: 1,
    flexGrow: 1,
    fontSize: "9px",
    alignItems: "center",
    height:50,
  },
  description: {
    width: "30%",
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: "center",
  },
  date: { 
    width: "10%", 
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: "center",
  },
  purchase: {
    width: "13%",
    borderRightColor: borderColor,
    borderRightWidth: 1, 
    textAlign: "center", 
  },
  status: {
    width: "13%",
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: "center",
  },
  number: {
    width: "10%",
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: "center",
  },
  code: {
    width: "15%",
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: "center",
  },
  uom: {
    width: "15%",
    borderRightColor: borderColor,
    borderRightWidth: 1,
    textAlign: "center",
  },
});

export class POTable extends React.Component {
  render() {
    let { itemDetail } = this.props;
    let ss= itemDetail;
    return itemDetail.map((item, index) => (
      <View style={styles.row} key={index}>
        <Text style={styles.code}>{item.item_code}</Text>
        <Text style={styles.description}>{item.Item_Desc}</Text>
        <Text style={styles.uom}>{item.UOM_DESC}</Text>
        <Text style={styles.uom}>{item.QTY}</Text>
        <Text style={styles.uom}>{item.item_quantity}</Text>
        <Text style={styles.number}>{item.variance}</Text>
      </View>
    ));
  }
}
