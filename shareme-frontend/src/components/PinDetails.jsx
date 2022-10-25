import React, { useEffect, useState } from "react";
import { MdDownloadForOffline } from "react-icons/md";
import { Link, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { client, urlFor } from "../client";
import MasonryLayout from "./MasonryLayout";
import { pinDetailMorePinQuery, pinDetailQuery } from "../utils/data";
import Spinner from "./Spinner";
import { Toast } from "@chakra-ui/react";

const PinDetail = ({ user }) => {
  const { pinId } = useParams(); // Get pin id from url

  const [pins, setPins] = useState();
  const [pinDetail, setPinDetail] = useState();
  const [comment, setComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  const fetchPinDetails = () => {
    const query = pinDetailQuery(pinId);

    if (query) {
      client.fetch(`${query}`).then((data) => {
        setPinDetail(data[0]);
        if (data[0]) {
          const query1 = pinDetailMorePinQuery(data[0]);
          client.fetch(query1).then((res) => {
            setPins(res); // * Set pins to fetched data json
          });
        }
      });
    }
  };

  // useEffect changes only when pinId changes
  useEffect(() => {
    fetchPinDetails();
  }, [pinId]);

  // Adding comments function
  const addComment = () => {
    if (comment) {
      setAddingComment(true);

      client // Patch the pin
        .patch(pinId)
        .setIfMissing({ comments: [] }) // Set comments array if not present
        .insert("after", "comments[-1]", [
          // Insert comment at the end of the array
          {
            comment,
            _key: uuidv4(), // Generate unique key
            postedBy: { _type: "postedBy", _ref: user._id }, // Reference to user
          },
        ])
        .commit() // Commit the changes
        .then(() => {
          // After commit
          fetchPinDetails(); // Fetch pin details
          setComment(""); // Clear comment
          window.location.reload(); // Reload the page
          setAddingComment(false); // Set adding comment to false
        });

        // Toast
        <Toast status="success" description="Your comment will be added soon!" />

    }
  };

  // Loading Pin
  if (!pinDetail) {
    return <Spinner message="Showing pin" />;
  }

  return (
    <div>
      {/* Pin exists */}
      {pinDetail && (
        <div
          className="flex xl:flex-row flex-col m-auto bg-white rounded-lg shadow-lg w-full xl:w-5/6"
          style={{ maxWidth: "1500px", borderRadius: "32px" }}
        >
          {/* Image */}
          <div className="flex justify-center items-center ">
            <img
              className="rounded-t-3xl rounded-b-lg"
              src={pinDetail?.image && urlFor(pinDetail?.image).url()}
              alt="user-post"
            />
          </div>
          {/* Link */}
          <div className="w-full p-5 flex-1 xl:min-w-620">
            {/* Title about */}
            <div>
              <h1 className="text-4xl font-bold break-words">
                {pinDetail.title}
              </h1>
              <p className="mt-3">{pinDetail.about}</p>
            </div>

            {/* Posted by */}
            <Link
              to={`/user-profile/${pinDetail?.postedBy._id}`}
              className="flex gap-2 mt-5 items-center bg-white rounded-lg "
            >
              <img
                src={pinDetail?.postedBy.image}
                className="w-10 h-10 rounded-full"
                alt="user-profile"
              />
              <p className="font-bold">{pinDetail?.postedBy.userName}</p>
            </Link>
            <div className="flex items-center justify-between mt-5">
              <div className="flex gap-2 items-center">
                {/* Download icon */}
                <a
                  href={`${pinDetail.image.asset.url}?dl=`}
                  download
                  className="bg-secondaryColor p-2 text-xl rounded-full flex items-center justify-center text-dark opacity-75 hover:opacity-100"
                >
                  <MdDownloadForOffline />
                </a>
              </div>
              {/* Link */}
              <a href={pinDetail.destination} target="_blank" rel="noreferrer">
                {pinDetail.destination?.length > 30
                  ? pinDetail.destination?.substring(0, 30) + "..."
                  : pinDetail.destination}
              </a>
            </div>
            {/* Comment section */}
            <h2 className="mt-5 text-2xl">Comments</h2>
            <div className="max-h-370 overflow-y-auto">
              {pinDetail?.comments?.map((item) => (
                <div
                  className="flex gap-2 mt-5 items-center bg-white rounded-lg"
                  key={item.comment}
                >
                  <img
                    src={item.postedBy?.image}
                    className="w-10 h-10 rounded-full cursor-pointer"
                    alt="user-profile"
                  />
                  <div className="flex flex-col">
                    <p className="font-bold">{item.postedBy?.userName}</p>
                    <p>{item.comment}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap mt-6 gap-3">
              {/* Who created this post */}
              <Link to={`/user-profile/${user._id}`}>
                <img
                  src={user.image}
                  className="w-10 h-10 rounded-full cursor-pointer"
                  alt="user-profile"
                />
              </Link>
              {/* Adding comments */}
              <input
                className=" flex-1 border-gray-200 outline-none border-2 p-2 rounded-2xl focus:border-gray-400"
                type="text"
                placeholder="Add a comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {/* Adding comment button */}
              <button
                type="button"
                className="bg-red-500 text-white rounded-full px-6 py-2 font-semibold text-base outline-none"
                onClick={addComment}
              >
                {addingComment ? "Doing..." : "Done"}
                {/* Show toast of adding comment */}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More from this user */}
      {pins?.length > 0 && (
        <h2 className="text-center font-bold text-2xl mt-8 mb-4">
          More from this user ({pins.length}) ▶
        </h2>
      )}
      {pins ? (
        <MasonryLayout pins={pins} />
      ) : (
        <Spinner message="Loading more pins" />
      )}
    </div>
  );
};

export default PinDetail;
