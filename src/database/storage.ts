import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CATEGORIES: 'BIT240202_DishCategory',
  DISHES: 'BIT240202_Dish'
};

const INITIAL_CATEGORIES = [
  { BIT240202_Id: "CAT1", BIT240202_Name: "Món Á", BIT240202_Description: "Món ăn châu Á" },
  { BIT240202_Id: "CAT2", BIT240202_Name: "Món Âu", BIT240202_Description: "Món ăn phương Tây" },
  { BIT240202_Id: "CAT3", BIT240202_Name: "Đồ uống & Tráng miệng", BIT240202_Description: "Đồ uống và tráng miệng" }
];

export const initStorage = async () => {
  const cats = await AsyncStorage.getItem(KEYS.CATEGORIES);
  if (!cats) {
    await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }
};

export const getCategories = async () => {
  const data = await AsyncStorage.getItem(KEYS.CATEGORIES);
  return data ? JSON.parse(data) : INITIAL_CATEGORIES;
};

export const getDishes = async () => {
  const data = await AsyncStorage.getItem(KEYS.DISHES);
  return data ? JSON.parse(data) : [];
};

export const saveDishes = async (dishes: any[]) => {
  await AsyncStorage.setItem(KEYS.DISHES, JSON.stringify(dishes));
};