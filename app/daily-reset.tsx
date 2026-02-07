import { View, Text } from "react-native";

export default function DailyResetScreen() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 12 }}>
        Comment tu te sens aujourd’hui ?
      </Text>
      <Text style={{ fontSize: 16, opacity: 0.8 }}>
        (placeholder Daily Reset – on branchera le vrai UI plus tard)
      </Text>
    </View>
  );
}

