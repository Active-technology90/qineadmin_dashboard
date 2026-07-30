import { useCategories } from "@/hooks/useCategories";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export const PopularCategories = ({
  refreshTrigger,
}: {
  refreshTrigger?: number;
}) => {
  const { categories, loading, refetch } = useCategories();
  const { t, i18n } = useTranslation("categories");   // <-- get i18n instance
  const isAmharic = i18n.language?.startsWith("am");

  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  if (!loading && (!categories || categories.length === 0)) {
    return null;
  }

  const skeletonArray = Array(6).fill(0);

  return (
    <View className="mt-6 px-4 bg-white">
      {/* Header with Accent Line */}
      <View className="flex-row justify-between items-center mb-2 mr-2 ml-2">
        <View className="flex-row items-center flex-1">
          <View className="w-[2.5px] h-5 bg-[#6750A4] rounded-full mr-3 opacity-60" />
          <Text className="text-xl font-bold text-secondary">
            {t("categories")}
          </Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center bg-secondary/10 px-3 py-1.5 rounded-full"
          activeOpacity={0.7}
          onPress={() => {
            // Navigate with 'all' as the ID so "All" category is selected by default
            router.push('/categories/all/subcategories');
          }}

        >
          <Text className="text-secondary text-xs font-semibold">
            {t("view_more")}
          </Text>
          <Feather
            name="chevron-right"
            size={14}
            color="#6750A4"
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>
      </View>

      <View className="border-b border-gray-200 mb-4" />

      {loading ? (
        <FlatList
          data={skeletonArray}
          keyExtractor={(_, idx) => `skeleton-${idx}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingRight: 16 }}
          renderItem={() => (
            <View className="w-28 flex flex-col items-center gap-2">
              <Skeleton width="100%" height={112} borderRadius={12} />
              <Skeleton width="80%" height={14} borderRadius={4} />
            </View>
          )}
        />
      ) : (
        <FlatList
          data={(categories || []).slice(0, 6)}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingRight: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              className="w-28"
              onPress={() =>
                router.push({
                  pathname: "/categories/[id]/subcategories",
                  params: {
                    id: String(item.id),
                  },
                })
              }
            >
              <View className="rounded-xl overflow-hidden border border-secondary bg-white">
                <Image
                  source={{
                    uri: item.icon || "https://picsum.photos/200/150?random=1",
                  }}
                  className="w-full h-28"
                  resizeMode="cover"
                />
              </View>

              <Text
                className="text-center text-secondary text-sm font-medium mt-2"
                numberOfLines={2}
              >
                {/* Conditional name based on language */}
                {isAmharic ? item.name_am || item.name : item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};