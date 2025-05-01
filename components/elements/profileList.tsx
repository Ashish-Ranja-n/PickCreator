
import { Profile } from "@/components/elements/profile";
import { motion } from "framer-motion";
import { User, MapPin } from "lucide-react";
import { UseIsMobile } from "@/utils/detectors";
import Image from "next/image";


interface ProfileListProps {
  profiles: Profile[];
  onProfileSelect: (profile: Profile) => void;
}

const ProfileList = ({ profiles, onProfileSelect }: ProfileListProps) => {
  const isMobile = UseIsMobile();

  return (
    <div className="grid grid-cols-1 gap-4 max-h-full overflow-y-auto pr-2 mb-16">
      
      {profiles.map((profile) => (
        <motion.div
          key={profile.id}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onProfileSelect(profile)}
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 w-full"
        >
          {isMobile ? (
            // Mobile layout
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-shrink-0">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-16 h-16 rounded-full object-cover"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {profile.isVerified && (
                    <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-gray-500">@{profile.username}</p>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{profile.location}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">Followers</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile.followers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Engagement</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile.engagement}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. Likes</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile.averageLikes.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Desktop layout
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative flex-shrink-0">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {profile.isVerified && (
                    <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-gray-500">@{profile.username}</p>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{profile.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-12">
                <div>
                  <p className="text-sm text-gray-500">Followers</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile.followers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Engagement</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile.engagement}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. Likes</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile.averageLikes.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default ProfileList;
