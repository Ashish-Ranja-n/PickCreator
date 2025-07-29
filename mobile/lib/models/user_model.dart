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

// Content Requirements Model
class ContentRequirements {
  final int? reels;
  final int? posts;
  final int? stories;
  final int? lives;

  ContentRequirements({this.reels, this.posts, this.stories, this.lives});

  factory ContentRequirements.fromJson(Map<String, dynamic> json) {
    return ContentRequirements(
      reels: json['reels'],
      posts: json['posts'],
      stories: json['stories'],
      lives: json['lives'],
    );
  }

  Map<String, dynamic> toJson() {
    return {'reels': reels, 'posts': posts, 'stories': stories, 'lives': lives};
  }
}

// Deal Influencer Model
class DealInfluencer {
  final String? id;
  final String? name;
  final String? profilePictureUrl;
  final double? offeredPrice;
  final String? status;
  final double? counterOffer;
  final String? city;

  DealInfluencer({
    this.id,
    this.name,
    this.profilePictureUrl,
    this.offeredPrice,
    this.status,
    this.counterOffer,
    this.city,
  });

  factory DealInfluencer.fromJson(Map<String, dynamic> json) {
    return DealInfluencer(
      id: json['id'],
      name: json['name'],
      profilePictureUrl: json['profilePictureUrl'],
      offeredPrice: json['offeredPrice']?.toDouble(),
      status: json['status'],
      counterOffer: json['counterOffer']?.toDouble(),
      city: json['city'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'profilePictureUrl': profilePictureUrl,
      'offeredPrice': offeredPrice,
      'status': status,
      'counterOffer': counterOffer,
      'city': city,
    };
  }
}

// Deal Model
class DealModel {
  final String? id;
  final String? brandId;
  final String? brandName;
  final String? brandProfilePic;
  final String? dealType;
  final String? dealName;
  final String? status;
  final String? paymentStatus;
  final String? description;
  final double? totalAmount;
  final double? budget;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final bool? paymentReleased;
  final bool? contentPublished;
  final List<DealInfluencer>? influencers;
  final ContentRequirements? contentRequirements;
  final List<ContentSubmission>? submittedContent;

  DealModel({
    this.id,
    this.brandId,
    this.brandName,
    this.brandProfilePic,
    this.dealType,
    this.dealName,
    this.status,
    this.paymentStatus,
    this.description,
    this.totalAmount,
    this.budget,
    this.createdAt,
    this.updatedAt,
    this.paymentReleased,
    this.contentPublished,
    this.influencers,
    this.contentRequirements,
    this.submittedContent,
  });

  factory DealModel.fromJson(Map<String, dynamic> json) {
    return DealModel(
      id: json['_id'] ?? json['id'],
      brandId: json['brandId'],
      brandName: json['brandName'],
      brandProfilePic: json['brandProfilePic'],
      dealType: json['dealType'],
      dealName: json['dealName'],
      status: json['status'],
      paymentStatus: json['paymentStatus'],
      description: json['description'],
      totalAmount: json['totalAmount']?.toDouble(),
      budget: json['budget']?.toDouble(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
      paymentReleased: json['paymentReleased'],
      contentPublished: json['contentPublished'],
      influencers: json['influencers'] != null
          ? (json['influencers'] as List)
                .map((inf) => DealInfluencer.fromJson(inf))
                .toList()
          : null,
      contentRequirements: json['contentRequirements'] != null
          ? ContentRequirements.fromJson(json['contentRequirements'])
          : null,
      submittedContent: json['submittedContent'] != null
          ? (json['submittedContent'] as List)
                .map((content) => ContentSubmission.fromJson(content))
                .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'brandId': brandId,
      'brandName': brandName,
      'brandProfilePic': brandProfilePic,
      'dealType': dealType,
      'dealName': dealName,
      'status': status,
      'paymentStatus': paymentStatus,
      'description': description,
      'totalAmount': totalAmount,
      'budget': budget,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'paymentReleased': paymentReleased,
      'contentPublished': contentPublished,
      'influencers': influencers?.map((inf) => inf.toJson()).toList(),
      'contentRequirements': contentRequirements?.toJson(),
      'submittedContent': submittedContent
          ?.map((content) => content.toJson())
          .toList(),
    };
  }

  // Helper method to get the first influencer (for single deals)
  DealInfluencer? get firstInfluencer {
    return influencers?.isNotEmpty == true ? influencers!.first : null;
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

// Brand Info Model (for deals and profile)
class BrandInfo {
  final String? id;
  final String? name;
  final String? email;
  final String? avatar;
  final String? companyName;
  final String? website;
  final String? logo;
  final String? bio;
  final String? phoneNumber;
  final String? location;

  BrandInfo({
    this.id,
    this.name,
    this.email,
    this.avatar,
    this.companyName,
    this.website,
    this.logo,
    this.bio,
    this.phoneNumber,
    this.location,
  });

  factory BrandInfo.fromJson(Map<String, dynamic> json) {
    return BrandInfo(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      email: json['email'],
      avatar: json['avatar'],
      companyName: json['companyName'],
      website: json['website'],
      logo: json['logo'],
      bio: json['bio'],
      phoneNumber: json['phoneNumber'],
      location: json['location'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'avatar': avatar,
      'companyName': companyName,
      'website': website,
      'logo': logo,
      'bio': bio,
      'phoneNumber': phoneNumber,
      'location': location,
    };
  }
}

// Pricing Models
class PricingModels {
  final FixedPricing? fixedPricing;
  final bool? negotiablePricing;
  final PackageDeals? packageDeals;
  final BarterDeals? barterDeals;

  PricingModels({
    this.fixedPricing,
    this.negotiablePricing,
    this.packageDeals,
    this.barterDeals,
  });

  factory PricingModels.fromJson(Map<String, dynamic> json) {
    return PricingModels(
      fixedPricing: json['fixedPricing'] != null
          ? FixedPricing.fromJson(json['fixedPricing'])
          : null,
      negotiablePricing: json['negotiablePricing'],
      packageDeals: json['packageDeals'] != null
          ? PackageDeals.fromJson(json['packageDeals'])
          : null,
      barterDeals: json['barterDeals'] != null
          ? BarterDeals.fromJson(json['barterDeals'])
          : null,
    );
  }
}

class FixedPricing {
  final bool? enabled;
  final double? storyPrice;
  final double? reelPrice;
  final double? postPrice;
  final double? livePrice;

  FixedPricing({
    this.enabled,
    this.storyPrice,
    this.reelPrice,
    this.postPrice,
    this.livePrice,
  });

  factory FixedPricing.fromJson(Map<String, dynamic> json) {
    return FixedPricing(
      enabled: json['enabled'],
      storyPrice: json['storyPrice']?.toDouble(),
      reelPrice: json['reelPrice']?.toDouble(),
      postPrice: json['postPrice']?.toDouble(),
      livePrice: json['livePrice']?.toDouble(),
    );
  }
}

class PackageDeals {
  final bool? enabled;
  final List<PackageDeal>? packages;

  PackageDeals({this.enabled, this.packages});

  factory PackageDeals.fromJson(Map<String, dynamic> json) {
    return PackageDeals(
      enabled: json['enabled'],
      packages: json['packages'] != null
          ? (json['packages'] as List)
                .map((p) => PackageDeal.fromJson(p))
                .toList()
          : null,
    );
  }
}

class PackageDeal {
  final String? name;
  final String? includedServices;
  final double? totalPrice;

  PackageDeal({this.name, this.includedServices, this.totalPrice});

  factory PackageDeal.fromJson(Map<String, dynamic> json) {
    return PackageDeal(
      name: json['name'],
      includedServices: json['includedServices'],
      totalPrice: json['totalPrice']?.toDouble(),
    );
  }
}

class BarterDeals {
  final bool? enabled;
  final List<String>? acceptedCategories;
  final String? restrictions;

  BarterDeals({this.enabled, this.acceptedCategories, this.restrictions});

  factory BarterDeals.fromJson(Map<String, dynamic> json) {
    return BarterDeals(
      enabled: json['enabled'],
      acceptedCategories: json['acceptedCategories'] != null
          ? List<String>.from(json['acceptedCategories'])
          : null,
      restrictions: json['restrictions'],
    );
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
  final PricingModels? pricingModels;

  InfluencerInfo({
    this.id,
    this.name,
    this.avatar,
    this.bio,
    this.location,
    this.followers,
    this.socialMediaLinks,
    this.isInstagramVerified,
    this.pricingModels,
  });

  factory InfluencerInfo.fromJson(Map<String, dynamic> json) {
    return InfluencerInfo(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      avatar: json['profilePictureUrl'] ?? json['avatar'],
      bio: json['bio'],
      location: json['city'] ?? json['location'],
      followers: json['followers'] ?? json['followerCount'],
      socialMediaLinks: json['socialMediaLinks'] != null
          ? (json['socialMediaLinks'] as List)
                .map((link) => SocialMediaLink.fromJson(link))
                .toList()
          : null,
      isInstagramVerified: json['isInstagramVerified'],
      pricingModels: json['pricingModels'] != null
          ? PricingModels.fromJson(json['pricingModels'])
          : null,
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
      'pricingModels': pricingModels,
    };
  }
}
