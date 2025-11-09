import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../Context/Auth";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removeUser } from "../Store/Slices/userSlice";

export const useGet = ({ url, required, autoFetch = false }) => {
  const user = useSelector((state) => state?.user?.data || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch); // only true if autoFetch
  const navigate = useNavigate();
  const auth = useAuth();
  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (required === true && !user?.token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: user?.token ? `Bearer ${user?.token}` : "",
        },
      });
      if (response.status === 200) {
        setData(response.data);
      }
    } catch (error) {
      console.error("errorGet", error);
      if (
        error.response?.data?.message === "Unauthenticated." &&
        error.response?.status === 401
      ) {
        dispatch(removeUser());
        localStorage.clear();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [url, user?.token, navigate, dispatch]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return { refetch: fetchData, loading, data, required };
};
