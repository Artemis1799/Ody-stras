using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace t5_back.Models;
public class ImagePoint
{
    [Required]
    public Guid ImageId { get; set; }
    
    [Required]
    public Guid PointId { get; set; }
    
    [ForeignKey("ImageId")]
    [NotMapped]
    [JsonIgnore]
    public Photo? Photo { get; set; }
    
    [ForeignKey("PointId")]
    [NotMapped]
    [JsonIgnore]
    public Point? Point { get; set; }
}
