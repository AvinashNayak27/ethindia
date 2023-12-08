import React, { useState, useCallback } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";

const ImageDrop = () => {
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [imageHash, setImageHash] = useState("");
  const [signature, setSignature] = useState("");
  const [account, setAccount] = useState("");

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    processFile(files[0]);
  }, []);

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setImageName(file.name);
      const reader = new FileReader();
      reader.onload = async (e) => {
        setImage(e.target.result);
        const hash = computeHash(e.target.result);
        setImageHash(hash);
      };
      reader.readAsDataURL(file);
    }
  };

  const computeHash = (dataUrl) => {
    const base64 = dataUrl.split(",")[1];
    const wordArray = CryptoJS.enc.Base64.parse(base64);
    const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
    return hash;
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      alert(
        "MetaMask is not installed. Please install it to use this feature."
      );
    }
  };

  const signImage = async () => {
    if (!window.ethereum) {
      alert(
        "MetaMask is not installed. Please install it to use this feature."
      );
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const imagehashid = ethers.utils.id(imageHash);
      const signature = await signer.signMessage(
        ethers.utils.arrayify(imagehashid)
      );
      setSignature(signature);
    } catch (error) {
      console.error("Error signing the image:", error);
    }
  };

  const onFileChange = (event) => {
    const files = event.target.files;
    processFile(files[0]);
  };

  const openFileDialog = () => {
    document.getElementById("fileInput").click();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <button
        onClick={connectWallet}
        className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {account ? `Connected: ${account}` : "Connect Wallet"}
      </button>

      <div
        className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer w-64 mb-4"
        onClick={openFileDialog}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        {image ? (
          <>
            <img
              src={image}
              alt="Preview"
              className="w-8 h-8 object-contain mx-auto"
            />
            <p className="text-sm text-gray-600 mt-2">{imageName}</p>
          </>
        ) : (
          <p className="text-gray-500">
            Drag and drop an image here, or click to select an image
          </p>
        )}
      </div>

      {image && (
        <div className="flex flex-col items-center">
          <div className="bg-gray-100 p-4 rounded-md mb-4 w-64 text-center">
            <p className="text-sm text-gray-600">Hash: {imageHash}</p>
          </div>

          <button
            onClick={signImage}
            className="mb-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign Image
          </button>

          {signature && (
            <div className="bg-gray-100 p-4 rounded-md w-64 text-center">
              <p className="text-sm text-gray-600 break-all">
                Signature: {signature}
              </p>
            </div>
          )}

          <div
            className="mt-4 w-128 h-128"
            style={{ width: "512px", height: "512px" }}
          >
            <img
              src={image}
              alt="Uploaded"
              className="object-contain w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDrop;
