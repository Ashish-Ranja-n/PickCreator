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

// Deal Model
class DealModel {
  final String? id;
  final String? brandId;
  final String? influencerId;
  final String? status;
  final String? description;
  final double? amount;
  final String? currency;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deadline;
  final bool? paymentReleased;
  final List<ContentSubmission>? contentSubmissions;
  final BrandInfo? brandInfo;
  final InfluencerInfo? influencerInfo;
  final String? rejectionReason;
  final double? counterOffer;

  DealModel({
    this.id,
    this.brandId,
    this.influencerId,
    this.status,
    this.description,
    this.amount,
    this.currency,
    this.createdAt,
    this.updatedAt,
    this.deadline,
    this.paymentReleased,
    this.contentSubmissions,
    this.brandInfo,
    this.influencerInfo,
    this.rejectionReason,
    this.counterOffer,
  });

  factory DealModel.fromJson(Map<String, dynamic> json) {
    return DealModel(
      id: json['_id'] ?? json['id'],
      brandId: json['brandId'],
      influencerId: json['influencerId'],
      status: json['status'],
      description: json['description'],
      amount: json['amount']?.toDouble(),
      currency: json['currency'] ?? 'INR',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
      deadline: json['deadline'] != null
          ? DateTime.parse(json['deadline'])
          : null,
      paymentReleased: json['paymentReleased'],
      contentSubmissions: json['contentSubmissions'] != null
          ? (json['contentSubmissions'] as List)
                .map((content) => ContentSubmission.fromJson(content))
                .toList()
          : null,
      brandInfo: json['brandInfo'] != null
          ? BrandInfo.fromJson(json['brandInfo'])
          : null,
      influencerInfo: json['influencerInfo'] != null
          ? InfluencerInfo.fromJson(json['influencerInfo'])
          : null,
      rejectionReason: json['rejectionReason'],
      counterOffer: json['counterOffer']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'brandId': brandId,
      'influencerId': influencerId,
      'status': status,
      'description': description,
      'amount': amount,
      'currency': currency,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'deadline': deadline?.toIso8601String(),
      'paymentReleased': paymentReleased,
      'contentSubmissions': contentSubmissions
          ?.map((content) => content.toJson())
          .toList(),
      'brandInfo': brandInfo?.toJson(),
      'influencerInfo': influencerInfo?.toJson(),
      'rejectionReason': rejectionReason,
      'counterOffer': counterOffer,
    };
  }
}

// Content Submission Model
class ContentSubmission {
  final String? id;
  final String? type;
  final String? url;
  final String? caption;
  final String? status;
  final DateTime? submittedAt;
  final String? rejectionComment;

  ContentSubmission({
    this.id,
    this.type,
    this.url,
    this.caption,
    this.status,
    this.submittedAt,
    this.rejectionComment,
  });

  factory ContentSubmission.fromJson(Map<String, dynamic> json) {
    return ContentSubmission(
      id: json['_id'] ?? json['id'],
      type: json['type'],
      url: json['url'],
      caption: json['caption'],
      status: json['status'],
      submittedAt: json['submittedAt'] != null
          ? DateTime.parse(json['submittedAt'])
          : null,
      rejectionComment: json['rejectionComment'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'url': url,
      'caption': caption,
      'status': status,
      'submittedAt': submittedAt?.toIso8601String(),
      'rejectionComment': rejectionComment,
    };
  }
}

// Brand Info Model (for deals)
class BrandInfo {
  final String? id;
  final String? name;
  final String? avatar;
  final String? companyName;
  final String? location;

  BrandInfo({this.id, this.name, this.avatar, this.companyName, this.location});

  factory BrandInfo.fromJson(Map<String, dynamic> json) {
    return BrandInfo(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      avatar: json['avatar'],
      companyName: json['companyName'],
      location: json['location'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
      'companyName': companyName,
      'location': location,
    };
  }
}

// Influencer Info Model (for deals and browsing)
class InfluencerInfo {
  final String? id;
  final String? name;
  final String? avatar;
  final String? bio;
  final String? location;
  final int? followers;
  final List<SocialMediaLink>? socialMediaLinks;
  final bool? isInstagramVerified;

  InfluencerInfo({
    this.id,
    this.name,
    this.avatar,
    this.bio,
    this.location,
    this.followers,
    this.socialMediaLinks,
    this.isInstagramVerified,
  });

  factory InfluencerInfo.fromJson(Map<String, dynamic> json) {
    return InfluencerInfo(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      avatar: json['avatar'],
      bio: json['bio'],
      location: json['location'],
      followers: json['followers'],
      socialMediaLinks: json['socialMediaLinks'] != null
          ? (json['socialMediaLinks'] as List)
                .map((link) => SocialMediaLink.fromJson(link))
                .toList()
          : null,
      isInstagramVerified: json['isInstagramVerified'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
      'bio': bio,
      'location': location,
      'followers': followers,
      'socialMediaLinks': socialMediaLinks
          ?.map((link) => link.toJson())
          .toList(),
      'isInstagramVerified': isInstagramVerified,
    };
  }
}
