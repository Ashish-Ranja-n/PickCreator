class UserModel {
  final String? id;
  final String? name;
  final String? email;
  final String? phoneNumber;
  final String? role;
  final String? avatar;
  final bool? isVerified;
  final bool? onboardingCompleted;
  final bool? instagramConnected;
  final bool? isInstagramVerified;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Brand-specific fields
  final String? companyName;
  final String? businessType;
  final String? website;
  final String? logo;
  final String? bio;
  final String? location;
  final bool? verifiedBrand;

  // Influencer-specific fields
  final int? age;
  final String? gender;
  final List<SocialMediaLink>? socialMediaLinks;
  final int? followers;
  final String? profilePicture;
  final int? onboardingStep;

  UserModel({
    this.id,
    this.name,
    this.email,
    this.phoneNumber,
    this.role,
    this.avatar,
    this.isVerified,
    this.onboardingCompleted,
    this.instagramConnected,
    this.isInstagramVerified,
    this.createdAt,
    this.updatedAt,
    // Brand fields
    this.companyName,
    this.businessType,
    this.website,
    this.logo,
    this.bio,
    this.location,
    this.verifiedBrand,
    // Influencer fields
    this.age,
    this.gender,
    this.socialMediaLinks,
    this.followers,
    this.profilePicture,
    this.onboardingStep,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      email: json['email'],
      phoneNumber: json['phoneNumber'],
      role: json['role'],
      avatar: json['avatar'],
      isVerified: json['isVerified'],
      onboardingCompleted: json['onboardingCompleted'],
      instagramConnected: json['instagramConnected'],
      isInstagramVerified: json['isInstagramVerified'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
      // Brand fields
      companyName: json['companyName'],
      businessType: json['businessType'],
      website: json['website'],
      logo: json['logo'],
      bio: json['bio'],
      location: json['location'],
      verifiedBrand: json['verifiedBrand'],
      // Influencer fields
      age: json['age'],
      gender: json['gender'],
      socialMediaLinks: json['socialMediaLinks'] != null
          ? (json['socialMediaLinks'] as List)
                .map((link) => SocialMediaLink.fromJson(link))
                .toList()
          : null,
      followers: json['followers'],
      profilePicture: json['profilePicture'],
      onboardingStep: json['onboardingStep'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phoneNumber': phoneNumber,
      'role': role,
      'avatar': avatar,
      'isVerified': isVerified,
      'onboardingCompleted': onboardingCompleted,
      'instagramConnected': instagramConnected,
      'isInstagramVerified': isInstagramVerified,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      // Brand fields
      'companyName': companyName,
      'businessType': businessType,
      'website': website,
      'logo': logo,
      'bio': bio,
      'location': location,
      'verifiedBrand': verifiedBrand,
      // Influencer fields
      'age': age,
      'gender': gender,
      'socialMediaLinks': socialMediaLinks
          ?.map((link) => link.toJson())
          .toList(),
      'followers': followers,
      'profilePicture': profilePicture,
      'onboardingStep': onboardingStep,
    };
  }

  bool get isBrand => role == 'Brand';
  bool get isInfluencer => role == 'Influencer';
  bool get isAdmin => role == 'Admin';

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? phoneNumber,
    String? role,
    String? avatar,
    bool? isVerified,
    bool? onboardingCompleted,
    bool? instagramConnected,
    bool? isInstagramVerified,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? companyName,
    String? businessType,
    String? website,
    String? logo,
    String? bio,
    String? location,
    bool? verifiedBrand,
    int? age,
    String? gender,
    List<SocialMediaLink>? socialMediaLinks,
    int? followers,
    String? profilePicture,
    int? onboardingStep,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      role: role ?? this.role,
      avatar: avatar ?? this.avatar,
      isVerified: isVerified ?? this.isVerified,
      onboardingCompleted: onboardingCompleted ?? this.onboardingCompleted,
      instagramConnected: instagramConnected ?? this.instagramConnected,
      isInstagramVerified: isInstagramVerified ?? this.isInstagramVerified,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      companyName: companyName ?? this.companyName,
      businessType: businessType ?? this.businessType,
      website: website ?? this.website,
      logo: logo ?? this.logo,
      bio: bio ?? this.bio,
      location: location ?? this.location,
      verifiedBrand: verifiedBrand ?? this.verifiedBrand,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      socialMediaLinks: socialMediaLinks ?? this.socialMediaLinks,
      followers: followers ?? this.followers,
      profilePicture: profilePicture ?? this.profilePicture,
      onboardingStep: onboardingStep ?? this.onboardingStep,
    );
  }
}

class SocialMediaLink {
  final String? platform;
  final String? url;

  SocialMediaLink({this.platform, this.url});

  factory SocialMediaLink.fromJson(Map<String, dynamic> json) {
    return SocialMediaLink(platform: json['platform'], url: json['url']);
  }

  Map<String, dynamic> toJson() {
    return {'platform': platform, 'url': url};
  }
}
