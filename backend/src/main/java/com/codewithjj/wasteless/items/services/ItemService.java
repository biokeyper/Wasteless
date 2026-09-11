package com.codewithjj.wasteless.items.services;

import com.codewithjj.wasteless.items.dtos.ItemCreationDTO;
import com.codewithjj.wasteless.items.entities.Item;
import org.springframework.web.multipart.MultipartFile;


import java.util.List;
import java.util.UUID;

public interface ItemService {
    Item createItem(ItemCreationDTO item, List<MultipartFile> imageFiles, UUID ownerId);
    String deleteItemById(String id, UUID userId);
    Item getItemById(String id);
    List<Item> getAllItems();
    Item updateItem(Item item, String id, UUID userId);
    List<Item> getItemsByUser(String userId);
    List<Item> getNearestItems(double latitude, double longitude, int offset,int limit);
    List<Item> getNearestItemsWithinRange(double latitude, double longitude,double range, int offset,int limit);
}
