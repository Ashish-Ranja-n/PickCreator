
import { Profile } from "@/components/elements/profile";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Users, Heart, MessageCircle, Play } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import Image from "next/image";


interface ProfileCardProps {
  profile: Profile;
  onClose: () => void;
}

const ProfileCard = ({ profile, onClose }: ProfileCardProps) => {
  const followersByCountry = [
    { name: "United States", value: 19.7, color: "#818CF8" },
    { name: "India", value: 10.9, color: "#6EE7B7" },
    { name: "Brazil", value: 8.4, color: "#2DD4BF" },
    { name: "Indonesia", value: 4.0, color: "#0EA5E9" },
    { name: "United Kingdom", value: 3.9, color: "#F472B6" },
    { name: "Other", value: 53.1, color: "#E5E7EB" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.name}
                  </h2>
                  <p className="text-gray-500">@{profile.username}</p>
                  <div className="flex items-center mt-2 text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{profile.location}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Metrics Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Followers</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {profile.followers.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Avg. Likes</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {profile.averageLikes.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Avg. Comments</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {profile.averageComments.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Play className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Avg. Plays</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {profile.averageReelPlays.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Followers by Country
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={followersByCountry}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {followersByCountry.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {followersByCountry.map((country) => (
                    <div
                      key={country.name}
                      className="flex items-center space-x-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: country.color }}
                      />
                      <span className="text-sm text-gray-600">
                        {country.name} ({country.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileCard;
