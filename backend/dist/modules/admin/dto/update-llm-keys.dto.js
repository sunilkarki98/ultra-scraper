"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteLLMConfigDto = exports.UpdateLLMConfigDto = exports.AddLLMConfigDto = void 0;
class AddLLMConfigDto {
    provider;
    model;
    apiKey;
}
exports.AddLLMConfigDto = AddLLMConfigDto;
class UpdateLLMConfigDto {
    id;
    provider;
    model;
    apiKey;
}
exports.UpdateLLMConfigDto = UpdateLLMConfigDto;
class DeleteLLMConfigDto {
    id;
}
exports.DeleteLLMConfigDto = DeleteLLMConfigDto;
