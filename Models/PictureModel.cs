using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Picture
{
    [Key]
    public Guid UUID { get; set; }
    
    public string? PictureData { get; set; }
    
    [MaxLength(255)]
    public string? PictureName { get; set; }
    
    [JsonIgnore]
    public ICollection<PicturePoint>? PicturePoints { get; set; }
}
