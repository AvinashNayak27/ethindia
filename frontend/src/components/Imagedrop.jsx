import React, { useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import lighthouse from "@lighthouse-web3/sdk";
import { abi } from "../../../contracts/artifacts/imageRegistrary.sol/ImageRegistry.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ImageDrop = () => {
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [imageHash, setImageHash] = useState("");
  const [signature, setSignature] = useState("");
  const [account, setAccount] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [cid, setCid] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    processFile(files);
  }, []);

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const processFile = (file) => {
    setSuccessMessage("");
    setErrorMessage("");
    if (file) {
      setImageName(file[0].name);
      const reader = new FileReader();
      reader.onload = async (e) => {
        setImage(e.target.result);
        const hash = computeHash(e.target.result);
        setImageHash(hash);
      };
      reader.readAsDataURL(file[0]);
      console.log("File:", file[0]);
      uploadToLighthouse(file); // Upload to Lighthouse
    }
  };

  const computeHash = (dataUrl) => {
    const base64 = dataUrl.split(",")[1];
    const wordArray = CryptoJS.enc.Base64.parse(base64);
    const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
    return "0x" + hash;
  };

  const scrollSepoliaChainId = "0x8274f"; // Chain ID for scrollSepolia is 5

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();

        if (network.chainId.toString() !== scrollSepoliaChainId) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: scrollSepoliaChainId }],
            });
          } catch (switchError) {
            console.error(
              "Error switching to scrollSepolia network:",
              switchError
            );
            setErrorMessage("Error switching to scrollSepolia network.");
          }
        }

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        toast.success("Wallet connected successfully!");
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        setErrorMessage("Error connecting to MetaMask.");
      }
    } else {
      setErrorMessage(
        "MetaMask is not installed. Please install it to use this feature."
      );
    }
  };

  const signImage = async () => {
    if (!window.ethereum) {
      setErrorMessage(
        "MetaMask is not installed. Please install it to use this feature."
      );
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(
        ethers.utils.arrayify(imageHash)
      );
      setSignature(signature);
    } catch (error) {
      console.error("Error signing the image:", error);
      setErrorMessage("Error signing the image.");
    }
  };

  const onFileChange = (event) => {
    const files = event.target.files;
    processFile(files);
  };

  const openFileDialog = () => {
    document.getElementById("fileInput").click();
  };

  const progressCallback = (progressData) => {
    let percentageDone =
      100 - (progressData?.total / progressData?.uploaded)?.toFixed(2);
    console.log(`Upload Progress: ${percentageDone}%`);
  };

  const uploadToLighthouse = async (file) => {
    try {
      const output = await lighthouse.upload(
        file,
        "8c94e5c8.a23394e4c97643ed8d6fae6ead3dbfb8",
        false,
        null,
        progressCallback
      );
      console.log("File Status:", output);
      setUploadStatus(
        `File uploaded successfully. Visit at https://gateway.lighthouse.storage/ipfs/${output.data.Hash}`
      );
      setCid(output.data.Hash);
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage("Error uploading file.");
    }
  };

  useEffect(() => {
    if (cid) {
      console.log("CID:", cid);
    }
  }, [cid]);

  const registerImage = async (cid, hash, signature) => {
    if (!window.ethereum) {
      setErrorMessage(
        "MetaMask is not installed. Please install it to use this feature."
      );
      return;
    }

    const imageRegistryAddress = "0x2d6156F69383fb29E27908b29047E3Cdbc76c97c";
    console.log("CID:", cid);
    console.log("Hash:", hash);
    console.log("Signature:", signature);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const signer = provider.getSigner();
      const imageRegistryContract = new ethers.Contract(
        imageRegistryAddress,
        abi,
        signer
      );

      const tx = await imageRegistryContract.registerImage(
        hash,
        cid,
        signature
      );
      await tx.wait();

      setSuccessMessage("Image registered successfully.");
    } catch (error) {
      console.error("Error registering the image:", error);
      setErrorMessage("Error registering the image." + error.reason);
      toast.error(error.reason);
    }
  };
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        setIsCameraOpen(true);
        videoRef.current.srcObject = stream;
        videoRef.current.style.display = "block"; // Make the video element visible
      }
    } catch (error) {
      console.error("Error accessing the camera:", error);
      setErrorMessage("Error accessing the camera.");
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      const imageDataUrl = canvasRef.current.toDataURL("image/png");

      setImage(imageDataUrl); // Set the captured image for preview
      const file = dataURLtoFile(imageDataUrl, "captured-image.png");
      processFile([file]);
      // close camera

      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.style.display = "none"; // Hide the video element again
      }
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  return (
    <div className="flex flex-col items-center p-4">
      <button
        onClick={connectWallet}
        className="mb-6 bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 active:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        aria-label="Connect Wallet"
      >
        {account ? `Connected: ${account}` : "Connect Wallet"}
      </button>

      {account && (
        <div className="w-full max-w-md">
          <button
            onClick={openCamera}
            className="mb-6 bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 active:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
          >
            Open Camera
          </button>
          <video
            ref={videoRef}
            autoPlay
            style={{ width: "640px", height: "480px", display: "none" }}
            className="rounded shadow-lg"
          ></video>
          <canvas
            ref={canvasRef}
            style={{ display: "none" }}
            width="640"
            height="480"
            className="rounded shadow-lg"
          ></canvas>
          {
            isCameraOpen && (
              <button
              onClick={captureImage}
              className="mb-6 bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 active:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out ml-4"
            >
              Capture Image
            </button> )
          }

          <div
            className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer mb-6 hover:border-gray-400 focus:outline-none focus:border-gray-500 transition duration-150 ease-in-out"
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
                  className="w-32 h-32 object-contain mx-auto"
                />
                <p className="text-sm text-gray-600 mt-2">{imageName}</p>
              </>
            ) : (
              <p className="text-gray-500">
                Drag and drop an image here, or click to select an image
              </p>
            )}
          </div>

          {image && !signature && (
            <button
              onClick={signImage}
              className="mb-6 bg-green-500 hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 active:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Sign Image
            </button>
          )}

          {signature && cid && (
            <div className="flex flex-col items-center mb-6">
              <div className="bg-gray-100 p-4 rounded-md mb-6 text-center">
                <p className="text-sm text-gray-600 truncate">
                  Hash: {imageHash}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  Signature: {signature}
                </p>
                <p className="text-sm text-gray-600 truncate">CID: {cid}</p>
              </div>

              <button
                onClick={() => registerImage(cid, imageHash, signature)}
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Register Image
              </button>
            </div>
          )}

          <ToastContainer />

          {successMessage && (
            <div className="p-4 text-green-700 bg-green-100 rounded-md">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-4 text-red-700 bg-red-100 rounded-md">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageDrop;
