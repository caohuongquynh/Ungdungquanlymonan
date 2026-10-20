import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { getDishes, saveDishes } from '../database/storage';

export const MOCK_API_URL = 'https://6ad73c0495e98f36aef215bf.mockapi.io/BIT240202_Dish';

export const fetchDishesFromMockAPI = async () => {
  try {
    const response = await axios.get(MOCK_API_URL);
    if (response.data) {
      await saveDishes(response.data);
      return response.data;
    }
  } catch (error: any) {
    console.log("Lỗi tải MockAPI:", error.message);
  }
  return null;
};

export const syncOfflineDataToMockAPI = async () => {
  try {
    const dishes = await getDishes();
    const unsyncedDishes = dishes.filter((d: any) => d.BIT240202_IsSynced === false);

    if (unsyncedDishes.length === 0) return;

    let updatedList = [...dishes];

    for (let dish of updatedList) {
      if (dish.BIT240202_IsSynced === false) {
        try {
          if (dish.isNew) {
            const { isNew, ...postData } = dish;
            const res = await axios.post(MOCK_API_URL, postData);
            if (res.status === 201) {
              dish.BIT240202_IsSynced = true;
              delete dish.isNew;
            }
          } else {
            const res = await axios.put(`${MOCK_API_URL}/${dish.id || dish.BIT240202_Id}`, dish);
            if (res.status === 200) {
              dish.BIT240202_IsSynced = true;
            }
          }
        } catch (err) {
          console.log("Sync error item:", dish.BIT240202_Name);
        }
      }
    }

    await saveDishes(updatedList);
  } catch (error: any) {
    console.log("Auto Sync Error:", error.message);
  }
};

export const listenNetworkAndSync = () => {
  return NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      syncOfflineDataToMockAPI();
    }
  });
};